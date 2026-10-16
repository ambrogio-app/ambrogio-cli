import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { after, before, test } from 'node:test';
import { once } from 'node:events';
import { AmbrogioBackend, PublicHttpError, backendUrl } from '../src/backend.js';

type Handler = (request: IncomingMessage, response: ServerResponse) => void;
let handler: Handler = (_request, response) => { response.writeHead(404).end(); };
const server = createServer((request, response) => handler(request, response));
let base: URL;

before(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  base = backendUrl(`http://127.0.0.1:${address.port}`);
});
after(async () => { server.closeAllConnections(); server.close(); await once(server, 'close'); });

function stream(response: ServerResponse, parts: string[]): void {
  response.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8',
    'x-vercel-ai-ui-message-stream': 'v1' });
  for (const part of parts) response.write(`data: ${part}\n\n`);
  response.end();
}

const start = JSON.stringify({ type: 'start', messageId: 'm1',
  messageMetadata: { conversationId: 'c1', turnId: 't1' } });

test('URL esplicito e invio del turno nuovo con risposta progressiva e conferma applicativa', async () => {
  assert.throws(() => backendUrl('file:///tmp/server'), /HTTP/);
  const bodies: unknown[] = [];
  handler = async (request, response) => {
    assert.equal(request.method, 'POST');
    assert.equal(request.url, '/api/conversations/turns');
    assert.match(request.headers['content-type'] ?? '', /application\/json/);
    let body = '';
    for await (const chunk of request) body += chunk;
    bodies.push(JSON.parse(body));
    response.writeHead(200, { 'Content-Type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' });
    response.write(`: heartbeat\n\ndata: ${start}\n\n`);
    response.write('data: {"type":"text-delta","id":"t1","delta":"Cia');
    setTimeout(() => {
      response.write('o "}\n\n');
      response.write('data: {"type":"text-delta","id":"t1","delta":"mondo"}\n\n');
      response.write('data: {"type":"finish","finishReason":"stop","messageMetadata":{"turnStatus":"answered"}}\n\n');
      response.end('data: [DONE]\n\n');
    }, 5);
  };
  const deltas: string[] = [];
  const result = await new AmbrogioBackend(base).send('ciao', null, delta => deltas.push(delta));
  assert.deepEqual(bodies, [{ text: 'ciao' }]);
  assert.deepEqual(deltas, ['Ciao ', 'mondo']);
  assert.deepEqual(result, { status: 'answered', conversationId: 'c1', turnId: 't1', answer: 'Ciao mondo' });
});

test('errore HTTP pubblico prima del flusso', async () => {
  handler = (_request, response) => response.writeHead(409, { 'Content-Type': 'application/json' })
    .end(JSON.stringify({ error: 'Un altro turno è in corso.' }));
  await assert.rejects(new AmbrogioBackend(base).send('ciao', null, () => {}),
    error => error instanceof PublicHttpError && error.status === 409 && error.message === 'Un altro turno è in corso.');
});

test('errore SSE sostituisce il testo e chiusura senza finish segnala interruzione', async () => {
  const backend = new AmbrogioBackend(base);
  handler = (_request, response) => stream(response, [start,
    JSON.stringify({ type: 'text-delta', id: 't1', delta: 'provvisorio' }),
    JSON.stringify({ type: 'error', errorText: 'Non riesco a completare la risposta.' }), '[DONE]']);
  assert.deepEqual(await backend.send('ciao', 'c1', () => {}),
    { status: 'failed', conversationId: 'c1', error: 'Non riesco a completare la risposta.' });
  handler = (_request, response) => stream(response, [start,
    JSON.stringify({ type: 'text-delta', id: 't1', delta: 'parziale' }), '[DONE]']);
  assert.deepEqual(await backend.send('ciao', 'c1', () => {}), { status: 'interrupted', conversationId: 'c1' });
});

test('elenco con cursore opaco e storico pending/answered', async () => {
  const paths: string[] = [];
  handler = (request, response) => {
    paths.push(request.url ?? '');
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/api/conversations') {
      response.end(JSON.stringify({ items: [{ id: 'c1', lastActivityAt: '2026-10-16T10:00:00.000Z' }], nextCursor: 'opaque' }));
    } else if (request.url === '/api/conversations?cursor=opaque') {
      response.end(JSON.stringify({ items: [], nextCursor: null }));
    } else if (request.url === '/api/conversations/c1') {
      response.end(JSON.stringify({ id: 'c1', createdAt: '2026-10-16T10:00:00.000Z',
        lastActivityAt: '2026-10-16T10:00:00.000Z', turns: [
          { id: 't1', text: 'ciao', acceptedAt: '2026-10-16T10:00:00.000Z', status: 'pending' },
          { id: 't2', text: 'di nuovo', acceptedAt: '2026-10-16T10:01:00.000Z',
            status: 'answered', answer: 'ciao', finishedAt: '2026-10-16T10:01:01.000Z' },
        ] }));
    } else response.writeHead(404).end();
  };
  const backend = new AmbrogioBackend(base);
  const first = await backend.list();
  assert.equal(first.nextCursor, 'opaque');
  assert.deepEqual((await backend.list(first.nextCursor ?? undefined)).items, []);
  const history = await backend.history('c1');
  assert.deepEqual(history.turns.map(turn => turn.status), ['pending', 'answered']);
  assert.deepEqual(paths, ['/api/conversations', '/api/conversations?cursor=opaque', '/api/conversations/c1']);
});
