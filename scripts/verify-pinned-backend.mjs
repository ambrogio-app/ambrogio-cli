import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer as createPortProbe } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const cli = fileURLToPath(new URL('..', import.meta.url));
const root = resolve(process.env.AMBROGIO_BACKEND_REPO ?? resolve(cli, '../ambrogio-app'));
const expectedCommit = '3f789c61815ca82eed87a67c91304fb1e6123805';
const actualCommit = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(actualCommit, expectedCommit, 'Il backend locale deve essere al commit dichiarato nel contratto del client.');
const require = createRequire(`${root}/packages/conversations/package.json`);
const Fastify = require('fastify');
const { registerTurnRoute } = await import(pathToFileURL(`${root}/packages/conversations/dist/adapters/in/http/turn-route.js`));
const { registerListRoute } = await import(pathToFileURL(`${root}/packages/conversations/dist/adapters/in/http/list-route.js`));
const { registerHistoryRoute } = await import(pathToFileURL(`${root}/packages/conversations/dist/adapters/in/http/history-route.js`));
const { httpAjvOptions } = await import(pathToFileURL(`${root}/packages/conversations/dist/adapters/in/http/http-validation.js`));
const { startConversationServer } = await import(pathToFileURL(`${root}/apps/server/dist/runtime/conversation-server.js`));
const { AmbrogioBackend, backendUrl, PublicHttpError } = await import(pathToFileURL(`${cli}/dist/src/backend.js`));

const server = Fastify({ ajv: { customOptions: httpAjvOptions } });
let sequence = 0;
registerTurnRoute(server, { language: 'it', exchange: async (input, observer) => {
  if (input.text === 'occupato') return { ok: false, error: { kind: 'occupied' } };
  sequence += 1;
  observer.admitted('11111111-1111-4111-8111-111111111111', `turn-${sequence}`);
  observer.delta('Ciao ');
  observer.delta('dal backend');
  if (input.text === 'errore') return { ok: true, value: { turnId: `turn-${sequence}`, outcome: 'failed', error: 'Errore pubblico.' } };
  return { ok: true, value: { turnId: `turn-${sequence}`, outcome: 'answered' } };
} });
registerListRoute(server, { language: 'it', maxPageSize: 100, listConversations: async () => ({
  items: [{ id: '11111111-1111-4111-8111-111111111111', lastActivityAt: new Date('2026-10-16T10:00:00.000Z') }], next: null,
}) });
registerHistoryRoute(server, { language: 'it', getConversation: async () => ({ ok: true, value: {
  id: '11111111-1111-4111-8111-111111111111', createdAt: '2026-10-16T10:00:00.000Z',
  lastActivityAt: '2026-10-16T10:00:00.000Z', turns: [
    { id: 't-pending', text: 'ciao', acceptedAt: '2026-10-16T10:00:00.000Z', status: 'pending' },
  ],
} }) });

try {
  const address = await server.listen({ port: 0, host: '127.0.0.1' });
  const client = new AmbrogioBackend(backendUrl(address));
  const deltas = [];
  const answered = await client.send('ciao', null, delta => deltas.push(delta));
  assert.deepEqual(deltas, ['Ciao ', 'dal backend']);
  assert.deepEqual(answered, { status: 'answered', conversationId: '11111111-1111-4111-8111-111111111111', turnId: 'turn-1', answer: 'Ciao dal backend' });
  assert.deepEqual(await client.send('errore', answered.conversationId, () => {}), {
    status: 'failed', conversationId: answered.conversationId, error: 'Errore pubblico.',
  });
  await assert.rejects(client.send('occupato', null, () => {}), error =>
    error instanceof PublicHttpError && error.status === 409 && error.message === 'Un altro turno è in corso.');
  assert.equal((await client.list()).items.length, 1);
  assert.equal((await client.history(answered.conversationId)).turns[0].status, 'pending');
  process.stdout.write('Pinned backend HTTP adapters: turn, SSE success/error, JSON rejection, list, history OK\n');
} finally {
  await server.close();
}

const directory = await mkdtemp(join(tmpdir(), 'ambrogio-cli-full-server-'));
let runtime;
let child;
let releaseSlow = () => {};
const slowReply = new Promise(resolve => { releaseSlow = resolve; });
try {
  const probe = createPortProbe();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const reservation = probe.address();
  assert(reservation && typeof reservation !== 'string');
  const port = reservation.port;
  probe.close();
  await once(probe, 'close');

  const httpConfig = join(directory, 'http.json');
  const conversationsConfig = join(directory, 'conversations.json');
  await writeFile(httpConfig, JSON.stringify({ host: '127.0.0.1', port }));
  await writeFile(conversationsConfig, JSON.stringify({ archivePath: join(directory, 'archive.sqlite'), language: 'it' }));
  runtime = await startConversationServer({ AMBROGIO_HTTP_CONFIG_PATH: httpConfig,
    AMBROGIO_CONVERSATIONS_CONFIG_PATH: conversationsConfig }, directory,
  async () => ({ orchestrator: { async *produce(history) {
    const text = history.turns.at(-1)?.text;
    if (text === 'errore') { yield 'parziale'; throw new Error('guasto controllato'); }
    if (text === 'lento') { yield 'Inizio '; await slowReply; yield 'fine'; return; }
    yield 'Ciao ';
    await new Promise(resolve => setTimeout(resolve, 15));
    yield 'dal server.';
  } }, async close() {} }));

  const origin = `http://127.0.0.1:${port}`;
  const command = `stty cols 100 rows 30; exec ${process.execPath} ${cli}/dist/src/cli.js --server ${origin}`;
  child = spawn('script', ['-qef', '-E', 'never', '-c', command, '/dev/null'],
    { cwd: cli, env: { ...process.env, SHELL: '/bin/sh', TERM: 'xterm-256color', AMBROGIO_URL: '' } });
  let output = '';
  let errors = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  child.stderr.setEncoding('utf8').on('data', chunk => { errors += chunk; });
  async function until(check, description) {
    const deadline = Date.now() + 10000;
    while (!(await check())) {
      if (Date.now() > deadline) throw new Error(`Attesa scaduta: ${description}\n${output.slice(-300)}\n${errors}`);
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
  const client = new AmbrogioBackend(backendUrl(origin));
  await until(() => output.includes('Nuova chat'), 'nuova chat iniziale');
  child.stdin.write('ciao\r');
  let conversationId;
  await until(async () => {
    const list = await client.list();
    conversationId = list.items[0]?.id;
    return conversationId && (await client.history(conversationId)).turns[0]?.status === 'answered';
  }, 'primo turno');
  await new Promise(resolve => setTimeout(resolve, 80));
  child.stdin.write('\u000e'); // Ctrl+N: start another local chat.
  await new Promise(resolve => setTimeout(resolve, 80));
  child.stdin.write('\t');
  await new Promise(resolve => setTimeout(resolve, 80));
  child.stdin.write('\u001b[B');
  await new Promise(resolve => setTimeout(resolve, 80));
  child.stdin.write('\r'); // Reopen the first conversation from the sidebar.
  await new Promise(resolve => setTimeout(resolve, 80));
  child.stdin.write('ancora\r');
  await until(async () => (await client.history(conversationId)).turns[1]?.status === 'answered', 'continuazione');
  await new Promise(resolve => setTimeout(resolve, 80));
  child.stdin.write('errore\r');
  await until(async () => (await client.history(conversationId)).turns[2]?.status === 'failed', 'errore conservato');
  await new Promise(resolve => setTimeout(resolve, 80));
  child.stdin.write('\u0011');
  const [code] = await once(child, 'exit');
  assert.equal(code, 0, `${errors}\n${output.slice(-1500)}`);
  assert.match(output, /Nuova chat/);
  assert.match(output, /ciao/);
  const list = await client.list();
  assert.equal(list.items.length, 1);
  const history = await client.history(list.items[0].id);
  assert.deepEqual(history.turns.map(turn => [turn.text, turn.status]),
    [['ciao', 'answered'], ['ancora', 'answered'], ['errore', 'failed']]);
  assert.equal(history.turns[2].error, 'Non riesco a completare la risposta.');
  assert.equal(history.turns[2].answer, undefined);
  const slowTurn = client.send('lento', list.items[0].id, () => {});
  let pending;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    pending = await client.history(list.items[0].id);
    if (pending.turns[3]?.status === 'pending') break;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.equal(pending.turns[3].status, 'pending');
  assert.equal(pending.turns[3].answer, undefined);
  releaseSlow();
  assert.equal((await slowTurn).status, 'answered');
  const refreshed = await client.history(list.items[0].id);
  assert.equal(refreshed.turns[3].status, 'answered');
  assert.equal(refreshed.turns[3].answer, 'Inizio fine');
  process.stdout.write('Full pinned HTTP server with controlled producer + separate terminal client: new, list, reopen, continue, persisted error, pending refresh OK\n');
} finally {
  releaseSlow();
  if (child?.exitCode === null) child.kill();
  if (runtime) await runtime.close();
  await rm(directory, { recursive: true, force: true });
}
