import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
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
