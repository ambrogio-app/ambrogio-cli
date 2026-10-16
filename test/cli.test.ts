import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';

const executable = new URL('../src/cli.js', import.meta.url).pathname.replace('/test/', '/src/');

test('l’avvio richiede un URL esplicito', async () => {
  const child = spawn(process.execPath, [executable], { env: { ...process.env, AMBROGIO_URL: '' } });
  let error = '';
  child.stderr.setEncoding('utf8').on('data', chunk => { error += chunk; });
  const [code] = await once(child, 'exit');
  assert.equal(code, 2);
  assert.match(error, /Indica l’URL del backend/);
});

test('il menu apre, aggiorna e continua una conversazione tramite HTTP', async () => {
  const requests: Array<{ method: string; path: string; body?: unknown }> = [];
  const server = createServer(async (request, response) => {
    const entry: { method: string; path: string; body?: unknown } =
      { method: request.method ?? '', path: request.url ?? '' };
    if (request.method === 'POST') {
      let body = '';
      for await (const chunk of request) body += chunk;
      entry.body = JSON.parse(body);
      requests.push(entry);
      response.writeHead(200, { 'Content-Type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' });
      for (const part of [
        { type: 'start', messageId: 'm1', messageMetadata: { conversationId: 'c1', turnId: 't1' } },
        { type: 'text-delta', id: 't1', delta: 'Risposta' },
        { type: 'finish', finishReason: 'stop', messageMetadata: { turnStatus: 'answered' } },
      ]) response.write(`data: ${JSON.stringify(part)}\n\n`);
      response.end('data: [DONE]\n\n');
      return;
    }
    requests.push(entry);
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/api/conversations') {
      response.end(JSON.stringify({ items: [{ id: 'c1', lastActivityAt: '2026-10-16T10:00:00.000Z' }], nextCursor: null }));
    } else if (request.url === '/api/conversations/c1') {
      const historyReads = requests.filter(row => row.path === '/api/conversations/c1').length;
      response.end(JSON.stringify({ id: 'c1', createdAt: '2026-10-16T10:00:00.000Z',
        lastActivityAt: '2026-10-16T10:00:00.000Z', turns: [
          historyReads === 1
            ? { id: 't1', text: 'ciao', acceptedAt: '2026-10-16T10:00:00.000Z', status: 'pending' }
            : { id: 't1', text: 'ciao', acceptedAt: '2026-10-16T10:00:00.000Z',
              status: 'answered', answer: 'Risposta conservata', finishedAt: '2026-10-16T10:00:01.000Z' },
        ] }));
    } else response.writeHead(404).end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  const child = spawn(process.execPath, [executable, '--server', `http://127.0.0.1:${address.port}`]);
  let output = '';
  let error = '';
  let cursor = 0;
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  child.stderr.setEncoding('utf8').on('data', chunk => { error += chunk; });
  async function answer(prompt: string, value: string): Promise<void> {
    const deadline = Date.now() + 5000;
    let index = output.indexOf(prompt, cursor);
    while (index < 0) {
      if (Date.now() > deadline) throw new Error(`Prompt mancante: ${prompt}\n${output}\n${error}`);
      await new Promise(resolve => setTimeout(resolve, 5));
      index = output.indexOf(prompt, cursor);
    }
    cursor = index + prompt.length;
    child.stdin.write(`${value}\n`);
  }
  try {
    await answer('Scelta: ', '1');
    await answer('Tu: ', 'ciao');
    await answer('Scelta: ', '2');
    await answer('Scelta: ', '4');
    await answer('Numero nell’elenco o ID conversazione: ', '1');
    await answer('Scelta: ', '5');
    await answer('Scelta: ', '6');
    await answer('Tu: ', 'ancora');
    await answer('Scelta: ', '0');
    const [code] = await once(child, 'exit');
    assert.equal(code, 0, error);
    assert.match(output, /Ambrogio: Risposta/);
    assert.match(output, /In elaborazione\. Aggiorna manualmente più tardi\./);
    assert.match(output, /Ambrogio: Risposta conservata/);
    assert.equal(requests.filter(request => request.path === '/api/conversations/c1').length, 2);
    assert.deepEqual(requests.filter(request => request.method === 'POST').map(request => request.body),
      [{ text: 'ciao' }, { text: 'ancora', conversationId: 'c1' }]);
  } finally {
    child.kill();
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
});

test('l’aggiornamento dell’elenco riparte dalla prima pagina', async () => {
  const paths: string[] = [];
  const server = createServer((request, response) => {
    paths.push(request.url ?? '');
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(request.url?.includes('cursor=')
      ? { items: [{ id: 'c2', lastActivityAt: '2026-10-16T09:00:00.000Z' }], nextCursor: null }
      : { items: [{ id: 'c1', lastActivityAt: '2026-10-16T10:00:00.000Z' }], nextCursor: 'opaque' }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  const child = spawn(process.execPath, [executable, '--server', `http://127.0.0.1:${address.port}`]);
  let output = '';
  let offset = 0;
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  async function choose(value: string): Promise<void> {
    const deadline = Date.now() + 5000;
    let index = output.indexOf('Scelta: ', offset);
    while (index < 0) {
      if (Date.now() > deadline) throw new Error(`Menu mancante: ${output}`);
      await new Promise(resolve => setTimeout(resolve, 5));
      index = output.indexOf('Scelta: ', offset);
    }
    offset = index + 'Scelta: '.length;
    child.stdin.write(`${value}\n`);
  }
  try {
    for (const value of ['2', '3', '5', '0']) await choose(value);
    const [code] = await once(child, 'exit');
    assert.equal(code, 0);
    assert.deepEqual(paths, ['/api/conversations', '/api/conversations?cursor=opaque', '/api/conversations']);
  } finally {
    child.kill();
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
});
