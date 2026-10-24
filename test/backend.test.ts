import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { after, before, test } from 'node:test';
import { once } from 'node:events';
import { AmbrogioBackend, PublicHttpError, backendUrl, sessionUrl, textRejection } from '../src/backend.js';
import { texts } from '../src/i18n.js';
import { startFakeBackend } from './fake-backend.js';

type Handler = (request: IncomingMessage, response: ServerResponse) => void;
let handler: Handler = (_request, response) => { response.writeHead(404).end(); };
const server = createServer((request, response) => handler(request, response));
let base: URL;
const identity = { clientId: 'cli-test', name: 'Terminale test' };

before(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  base = backendUrl(`http://127.0.0.1:${address.port}`, texts.it);
});
after(async () => { server.closeAllConnections(); server.close(); await once(server, 'close'); });

test('URL esplicito e indirizzo del canale conversazionale', () => {
  assert.throws(() => backendUrl('file:///tmp/server', texts.it), /HTTP/);
  assert.equal(sessionUrl(backendUrl('http://casa.lan:3000/ambrogio', texts.it)).href, 'ws://casa.lan:3000/ambrogio/api/session');
  assert.equal(sessionUrl(backendUrl('https://casa.lan', texts.it)).href, 'wss://casa.lan/api/session');
});

test('nuovo turno con identità, risposta progressiva e successo solo con turn.completed', async () => {
  let release!: () => void;
  const completed = new Promise<void>(resolve => { release = resolve; });
  const fake = await startFakeBackend({ async onTurn(turn) {
    turn.accept('c1', 't1');
    turn.send({ type: 'output.start', requestId: turn.requestId, turnId: 't1', stream: 7, content: { type: 'text' } });
    turn.send({ type: 'output.chunk', stream: 7, text: 'Ciao ' });
    turn.send({ type: 'output.chunk', stream: 7, text: 'mondo' });
    turn.send({ type: 'output.end', stream: 7 });
    await completed;
    turn.send({ type: 'turn.completed', turnId: 't1', expectsReply: true });
  } });
  const backend = new AmbrogioBackend(backendUrl(fake.url, texts.it), identity, texts.it);
  try {
    const deltas: string[] = [];
    let settled = false;
    const result = backend.send('ciao', null, delta => deltas.push(delta));
    void result.then(() => { settled = true; });
    while (deltas.length < 2) await new Promise(resolve => setTimeout(resolve, 5));
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(settled, false, 'output.end alone does not confirm the turn');
    release();
    assert.deepEqual(await result, { status: 'answered', conversationId: 'c1', turnId: 't1', answer: 'Ciao mondo' });
    assert.deepEqual(deltas, ['Ciao ', 'mondo']);
    assert.deepEqual(fake.hellos, [{ type: 'session.hello', clientId: 'cli-test', name: 'Terminale test' }]);
    const [start] = fake.starts();
    assert.deepEqual({ ...start, requestId: undefined, stream: undefined },
      { type: 'input.start', requestId: undefined, stream: undefined, content: { type: 'text' }, reply: 'text' });
    assert.deepEqual(fake.messages.filter(message => message.type !== 'session.hello').map(message => message.type),
      ['input.start', 'input.chunk', 'input.end']);
  } finally { await backend.close(); await fake.close(); }
});

test('rifiuto, errore dopo l’ammissione e interruzione concludono il turno con il loro esito', async () => {
  const fake = await startFakeBackend({ onTurn(turn) {
    if (turn.text === 'occupata') {
      turn.transmit(['Un altro turno è in corso.']);
      turn.send({ type: 'turn.rejected', requestId: turn.requestId, reason: 'occupied',
        message: 'Un altro turno è in corso.' });
    } else if (turn.text === 'guasto') {
      turn.accept('c1', 't2');
      turn.transmit(['provvisorio']);
      turn.transmit(['Non riesco a completare la risposta.']);
      turn.send({ type: 'turn.failed', turnId: 't2', message: 'Non riesco a completare la risposta.' });
    } else if (turn.text === 'arresto') {
      turn.accept('c1', 't3');
      turn.transmit(['parziale']);
      turn.send({ type: 'turn.interrupted', turnId: 't3' });
    } else if (turn.text === 'chiusura') {
      turn.accept('c1', 't4');
      turn.transmit(['parziale']);
      turn.socket.close();
    } else {
      turn.accept('c1', 't5');
      turn.transmit(['di nuovo']);
      turn.send({ type: 'turn.completed', turnId: 't5', expectsReply: false });
    }
  } });
  const backend = new AmbrogioBackend(backendUrl(fake.url, texts.it), identity, texts.it);
  try {
    assert.deepEqual(await backend.send('occupata', 'c1', () => {}),
      { status: 'failed', conversationId: 'c1', error: 'Un altro turno è in corso.' });
    assert.deepEqual(await backend.send('guasto', 'c1', () => {}),
      { status: 'failed', conversationId: 'c1', error: 'Non riesco a completare la risposta.' });
    assert.deepEqual(await backend.send('arresto', 'c1', () => {}), { status: 'interrupted', conversationId: 'c1' });
    assert.deepEqual(await backend.send('chiusura', 'c1', () => {}), { status: 'interrupted', conversationId: 'c1' });
    assert.equal(fake.hellos.length, 1);
    assert.equal((await backend.send('dopo', 'c1', () => {})).status, 'answered');
    assert.equal(fake.hellos.length, 2, 'a closed session is reopened for the next turn');
    assert.deepEqual(fake.starts().map(start => start.conversationId), ['c1', 'c1', 'c1', 'c1', 'c1']);
  } finally { await backend.close(); await fake.close(); }
});

test('il controllo locale del testo usa le voci del catalogo e ammette fino a 64 KiB in UTF-8', () => {
  for (const language of ['it', 'en'] as const) {
    assert.equal(textRejection('', texts[language]), texts[language].emptyMessage);
    assert.equal(textRejection(' \t\n ', texts[language]), texts[language].emptyMessage);
    assert.equal(textRejection('€'.repeat(21_846), texts[language]), texts[language].messageTooLarge);
  }
  assert.equal(textRejection(`${'€'.repeat(21_845)}a`, texts.it), undefined, '65 536 bytes are allowed');
  assert.equal(textRejection(' ciao ', texts.en), undefined);
});

test('controlli locali del testo ed estensioni non supportate', async () => {
  const fake = await startFakeBackend({ onTurn(turn) {
    turn.send({ type: 'player.play', id: 'action-1', title: 'canzone' });
    turn.send({ type: 'notice.info', text: 'ignorato' });
    turn.accept('c1', 't1');
    turn.send({ type: 'turn.completed', turnId: 't1', expectsReply: false });
  } });
  const backend = new AmbrogioBackend(backendUrl(fake.url, texts.it), identity, texts.it);
  try {
    await assert.rejects(backend.send('   ', null, () => {}), /non vuoto/);
    await assert.rejects(backend.send('è'.repeat(32_769), null, () => {}), /64 KiB/);
    assert.equal(fake.hellos.length, 0);
    assert.equal((await backend.send('ciao', null, () => {})).status, 'answered');
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.deepEqual(fake.messages.filter(message => message.type === 'client.result'),
      [{ type: 'client.result', id: 'action-1', ok: false, reason: 'unsupported' }]);
  } finally { await backend.close(); await fake.close(); }
});

test('elenco con cursore opaco e storico pending/answered', async () => {
  const paths: string[] = [];
  handler = (request, response) => {
    paths.push(request.url ?? '');
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/api/v1/conversations') {
      response.end(JSON.stringify({ items: [{ id: 'c1', lastActivityAt: '2026-10-16T10:00:00.000Z' }], nextCursor: 'opaque' }));
    } else if (request.url === '/api/v1/conversations?cursor=opaque') {
      response.end(JSON.stringify({ items: [], nextCursor: null }));
    } else if (request.url === '/api/v1/conversations/c1') {
      response.end(JSON.stringify({ id: 'c1', createdAt: '2026-10-16T10:00:00.000Z',
        lastActivityAt: '2026-10-16T10:00:00.000Z', turns: [
          { id: 't1', text: 'ciao', acceptedAt: '2026-10-16T10:00:00.000Z', status: 'pending' },
          { id: 't2', text: 'di nuovo', acceptedAt: '2026-10-16T10:01:00.000Z',
            status: 'answered', answer: 'ciao', finishedAt: '2026-10-16T10:01:01.000Z' },
        ] }));
    } else response.writeHead(404).end();
  };
  const backend = new AmbrogioBackend(base, identity, texts.it);
  const first = await backend.list();
  assert.equal(first.nextCursor, 'opaque');
  assert.deepEqual((await backend.list(first.nextCursor ?? undefined)).items, []);
  const history = await backend.history('c1');
  assert.deepEqual(history.turns.map(turn => turn.status), ['pending', 'answered']);
  assert.deepEqual(paths, ['/api/v1/conversations', '/api/v1/conversations?cursor=opaque', '/api/v1/conversations/c1']);
});

// Verification: Prova della presentazione degli errori HTTP nel client terminale
test('errori HTTP interpretati soltanto dal type del Problem Details, nelle due lingue', async () => {
  const replies: Record<string, { status: number; type: string; body: unknown }> = {
    '/api/v1/conversations/missing': { status: 404, type: 'application/problem+json',
      body: { type: '/problems/conversation-not-found', title: 'BACKEND_TITLE', status: 404, detail: 'BACKEND_DETAIL' } },
    '/api/v1/conversations/unknown': { status: 409, type: 'application/problem+json; charset=utf-8',
      body: { type: '/problems/something-new', title: 'BACKEND_TITLE', status: 409 } },
    '/api/v1/conversations/fault': { status: 500, type: 'application/problem+json',
      body: { type: 'about:blank', title: 'Internal Server Error', status: 500 } },
    '/api/v1/conversations/plain': { status: 404, type: 'application/json',
      body: { type: '/problems/conversation-not-found', error: 'BACKEND_ERROR' } },
    '/api/v1/conversations': { status: 400, type: 'application/problem+json',
      body: { type: '/problems/invalid-pagination', title: 'BACKEND_TITLE', status: 400 } },
  };
  handler = (request, response) => {
    const reply = replies[request.url ?? '']!;
    response.writeHead(reply.status, { 'Content-Type': reply.type }).end(JSON.stringify(reply.body));
  };
  const expected = {
    it: { missing: 'Conversazione non trovata.', unknown: 'Errore HTTP 409.', fault: 'Errore HTTP 500.',
      plain: 'Errore HTTP 404.', list: 'Errore HTTP 400.' },
    en: { missing: 'Conversation not found.', unknown: 'HTTP error 409.', fault: 'HTTP error 500.',
      plain: 'HTTP error 404.', list: 'HTTP error 400.' },
  } as const;
  for (const language of ['it', 'en'] as const) {
    const backend = new AmbrogioBackend(base, identity, texts[language]);
    for (const id of ['missing', 'unknown', 'fault', 'plain'] as const) {
      await assert.rejects(backend.history(id), (error: Error) => {
        assert.ok(error instanceof PublicHttpError);
        assert.equal(error.message, expected[language][id]);
        assert.doesNotMatch(error.message, /BACKEND_/);
        return true;
      });
    }
    await assert.rejects(backend.list(), { message: expected[language].list });
  }
});
