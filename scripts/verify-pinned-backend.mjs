import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer as createPortProbe } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const cli = fileURLToPath(new URL('..', import.meta.url));
const root = resolve(process.env.AMBROGIO_BACKEND_REPO ?? resolve(cli, '../ambrogio-backend'));
const expectedCommit = '58b0df420aee7c08280afd818ffcd0e82b060029';
const actualCommit = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(actualCommit, expectedCommit, 'Il backend locale deve essere al commit dichiarato nel contratto del client.');
const { startConversationServer } = await import(pathToFileURL(`${root}/apps/server/dist/runtime/conversation-server.js`));
const { AmbrogioBackend, backendUrl } = await import(pathToFileURL(`${cli}/dist/src/backend.js`));
const identity = { clientId: 'cli-verifica', name: 'Terminale verifica' };
const text = value => ({ kind: 'text', text: value });
const expectation = expectsReply => ({ kind: 'reply_expectation', expectsReply });

const directory = await mkdtemp(join(tmpdir(), 'ambrogio-cli-full-server-'));
let runtime;
let child;
let releaseSlow = () => {};
const slowReply = new Promise(resolve => { releaseSlow = resolve; });
const neverReply = new Promise(() => {});
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
    const last = history.turns.at(-1)?.text;
    if (last === 'errore') { yield text('parziale'); throw new Error('guasto controllato'); }
    if (last === 'lento') { yield text('Inizio '); await slowReply; yield text('fine'); yield expectation(false); return; }
    if (last === 'arresto') { yield text('sto pensando'); await neverReply; return; }
    yield text('Ciao ');
    await new Promise(resolve => setTimeout(resolve, 15));
    yield text('dal server.');
    yield expectation(false);
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
  const client = new AmbrogioBackend(backendUrl(origin), identity);
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
  const conversation = list.items[0].id;
  const deltas = [];
  assert.deepEqual(await client.send('di nuovo', conversation, delta => deltas.push(delta)),
    { status: 'answered', conversationId: conversation, turnId: (await client.history(conversation)).turns[3].id,
      answer: 'Ciao dal server.' });
  assert.deepEqual(deltas, ['Ciao ', 'dal server.']);
  assert.deepEqual(await client.send('errore', conversation, () => {}),
    { status: 'failed', conversationId: conversation, error: 'Non riesco a completare la risposta.' });
  assert.deepEqual(await client.send('ciao', 'inesistente', () => {}),
    { status: 'failed', conversationId: 'inesistente', error: 'Conversazione non trovata.' });

  const other = new AmbrogioBackend(backendUrl(origin), { clientId: 'cli-altro', name: 'Terminale altro' });
  const slowTurn = client.send('lento', conversation, () => {});
  let pending;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    pending = await client.history(conversation);
    if (pending.turns.at(-1)?.status === 'pending') break;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.equal(pending.turns.at(-1).text, 'lento');
  assert.equal(pending.turns.at(-1).status, 'pending');
  assert.equal(pending.turns.at(-1).answer, undefined);
  assert.deepEqual(await other.send('anche io', conversation, () => {}),
    { status: 'failed', conversationId: conversation, error: 'Un altro turno è in corso.' });
  releaseSlow();
  assert.equal((await slowTurn).status, 'answered');
  const refreshed = await client.history(conversation);
  assert.equal(refreshed.turns.at(-1).status, 'answered');
  assert.equal(refreshed.turns.at(-1).answer, 'Inizio fine');
  assert.ok(refreshed.turns.every(turn => turn.text !== 'anche io'), 'the rejected turn is not stored');

  const stopping = client.send('arresto', conversation, () => {});
  await until(async () => (await client.history(conversation)).turns.at(-1)?.text === 'arresto', 'turno da interrompere');
  const closing = runtime.close();
  runtime = undefined;
  assert.deepEqual(await stopping, { status: 'interrupted', conversationId: conversation });
  await closing;
  await other.close();
  await client.close();
  process.stdout.write('Full pinned ambrogio.v1 server with controlled producer + separate terminal client: new, list, reopen, continue, progressive answer, persisted error, rejections, pending refresh, shutdown interruption OK\n');
} finally {
  releaseSlow();
  if (child?.exitCode === null) child.kill();
  if (runtime) await runtime.close();
  await rm(directory, { recursive: true, force: true });
}
