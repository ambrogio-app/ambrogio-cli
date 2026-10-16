import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';

const executable = new URL('../src/cli.js', import.meta.url).pathname.replace('/test/', '/src/');

async function until(check: () => boolean, details: () => string): Promise<void> {
  const deadline = Date.now() + 7000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`Attesa scaduta: ${details()}`);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}

test('l’avvio richiede un URL esplicito', async () => {
  const child = spawn(process.execPath, [executable], { env: { ...process.env, AMBROGIO_URL: '' } });
  let error = '';
  child.stderr.setEncoding('utf8').on('data', chunk => { error += chunk; });
  const [code] = await once(child, 'exit');
  assert.equal(code, 2);
  assert.match(error, /Indica l’URL del backend/);
});

test('la chat resta aperta tra due turni e la barra laterale usa le anteprime HTTP', async () => {
  const requests: Array<{ method: string; path: string; body?: any }> = [];
  let sent = 0;
  const server = createServer(async (request, response) => {
    const path = request.url ?? '';
    const entry: { method: string; path: string; body?: any } = { method: request.method ?? '', path };
    if (request.method === 'POST') {
      let body = '';
      for await (const chunk of request) body += chunk;
      entry.body = JSON.parse(body);
      requests.push(entry);
      sent += 1;
      response.writeHead(200, { 'Content-Type': 'text/event-stream',
        'x-vercel-ai-ui-message-stream': 'v1' });
      response.write(`data: ${JSON.stringify({ type: 'start', messageId: `m${sent}`,
        messageMetadata: { conversationId: 'c1', turnId: `t${sent}` } })}\n\n`);
      response.write(`data: ${JSON.stringify({ type: 'text-delta', id: `t${sent}`, delta: 'Risposta' })}\n\n`);
      response.write(`data: ${JSON.stringify({ type: 'finish', finishReason: 'stop',
        messageMetadata: { turnStatus: 'answered' } })}\n\n`);
      response.end('data: [DONE]\n\n');
      return;
    }
    requests.push(entry);
    response.setHeader('Content-Type', 'application/json');
    if (path === '/api/conversations') {
      response.end(JSON.stringify({ items: [{ id: 'c0', lastActivityAt: '2026-10-16T10:00:00.000Z' }],
        nextCursor: null }));
    } else if (path === '/api/conversations/c0') {
      response.end(JSON.stringify({ id: 'c0', createdAt: '2026-10-16T10:00:00.000Z',
        lastActivityAt: '2026-10-16T10:00:00.000Z', turns: [{ id: 'old', text: 'un vecchio messaggio',
          acceptedAt: '2026-10-16T10:00:00.000Z', status: 'answered', answer: 'Archivio',
          finishedAt: '2026-10-16T10:00:01.000Z' }] }));
    } else if (path === '/api/conversations/c1') {
      response.end(JSON.stringify({ id: 'c1', createdAt: '2026-10-16T10:00:00.000Z',
        lastActivityAt: '2026-10-16T10:00:00.000Z', turns: requests.filter(row => row.method === 'POST')
          .map((row, index) => ({ id: `t${index + 1}`, text: row.body.text,
            acceptedAt: '2026-10-16T10:00:00.000Z', status: 'answered', answer: 'Risposta',
            finishedAt: '2026-10-16T10:00:01.000Z' })) }));
    } else response.writeHead(404).end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  const command = `stty cols 100 rows 30; exec ${process.execPath} ${executable} --server http://127.0.0.1:${address.port}`;
  const child = spawn('script', ['-qef', '-E', 'never', '-c', command, '/dev/null'],
    { env: { ...process.env, SHELL: '/bin/sh', TERM: 'xterm-256color' } });
  let output = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  try {
    await until(() => output.includes('Nuova chat') && output.includes('un vecchio'),
      () => `schermata iniziale; ${output.slice(-300)}`);
    child.stdin.write('ciao\r');
    await until(() => requests.filter(row => row.method === 'POST').length === 1
      && requests.some(row => row.path === '/api/conversations/c1'), () => 'primo turno');
    await until(() => output.includes('ciao'), () => 'anteprima della nuova chat');
    child.stdin.write('ancora\r');
    await until(() => requests.filter(row => row.method === 'POST').length === 2
      && requests.filter(row => row.path === '/api/conversations/c1').length === 2,
    () => 'secondo turno');
    assert.deepEqual(requests.filter(row => row.method === 'POST').map(row => row.body),
      [{ text: 'ciao' }, { text: 'ancora', conversationId: 'c1' }]);
    child.stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 80));
    child.stdin.write('\u001b[B');
    await new Promise(resolve => setTimeout(resolve, 80));
    child.stdin.write('\r');
    await until(() => requests.filter(row => row.path === '/api/conversations/c0').length >= 2,
      () => `apertura della chat scelta nella barra laterale; ${output.slice(-900)}`);
    assert.match(output, /Nuova chat/);
    assert.match(output, /un vecchio/);
    child.stdin.write('\u0011');
    const [code] = await once(child, 'exit');
    assert.equal(code, 0);
  } finally {
    child.kill();
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
});

test('la barra laterale carica altre chat e aggiorna dalla prima pagina', async () => {
  const paths: string[] = [];
  const server = createServer((request, response) => {
    const path = request.url ?? '';
    paths.push(path);
    response.setHeader('Content-Type', 'application/json');
    if (path.startsWith('/api/conversations/')) {
      const id = path.split('/').at(-1);
      response.end(JSON.stringify({ id, createdAt: '2026-10-16T10:00:00.000Z',
        lastActivityAt: '2026-10-16T10:00:00.000Z', turns: [{ id: 't1', text: `messaggio ${id}`,
          acceptedAt: '2026-10-16T10:00:00.000Z', status: 'answered', answer: 'ok',
          finishedAt: '2026-10-16T10:00:01.000Z' }] }));
    } else if (path === '/api/conversations?cursor=opaque') {
      response.end(JSON.stringify({ items: [{ id: 'c2', lastActivityAt: '2026-10-16T09:00:00.000Z' }],
        nextCursor: null }));
    } else {
      response.end(JSON.stringify({ items: [{ id: 'c1', lastActivityAt: '2026-10-16T10:00:00.000Z' }],
        nextCursor: 'opaque' }));
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  const command = `stty cols 100 rows 30; exec ${process.execPath} ${executable} --server http://127.0.0.1:${address.port}`;
  const child = spawn('script', ['-qef', '-E', 'never', '-c', command, '/dev/null'],
    { env: { ...process.env, SHELL: '/bin/sh', TERM: 'xterm-256color' } });
  let output = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  try {
    await until(() => output.includes('messaggio c1'), () => 'prima pagina');
    child.stdin.write('\u000c');
    await until(() => paths.includes('/api/conversations?cursor=opaque'), () => 'pagina successiva');
    await until(() => output.includes('messaggio c2'), () => 'anteprima seconda pagina');
    child.stdin.write('\u0012');
    await until(() => paths.filter(path => path === '/api/conversations').length === 2,
      () => 'aggiornamento della prima pagina');
    child.stdin.write('\u0011');
    const [code] = await once(child, 'exit');
    assert.equal(code, 0);
    assert.deepEqual(paths.filter(path => path.startsWith('/api/conversations?') || path === '/api/conversations'),
      ['/api/conversations', '/api/conversations?cursor=opaque', '/api/conversations']);
  } finally {
    child.kill();
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
});

test('una chat riaperta passa da in elaborazione a risposta dopo aggiornamento manuale', async () => {
  let historyReads = 0;
  let posts = 0;
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.method === 'POST') { posts += 1; response.writeHead(500).end(); return; }
    if (request.url === '/api/conversations') {
      response.end(JSON.stringify({ items: [{ id: 'c0', lastActivityAt: '2026-10-16T10:00:00.000Z' }],
        nextCursor: null }));
      return;
    }
    historyReads += 1;
    response.end(JSON.stringify({ id: 'c0', createdAt: '2026-10-16T10:00:00.000Z',
      lastActivityAt: '2026-10-16T10:00:00.000Z', turns: [{ id: 't1', text: 'messaggio iniziale',
        acceptedAt: '2026-10-16T10:00:00.000Z', status: historyReads < 3 ? 'pending' : 'answered',
        ...(historyReads < 3 ? {} : { answer: 'Risposta conservata', finishedAt: '2026-10-16T10:00:01.000Z' }) }] }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  const command = `stty cols 100 rows 30; exec ${process.execPath} ${executable} --server http://127.0.0.1:${address.port}`;
  const child = spawn('script', ['-qef', '-E', 'never', '-c', command, '/dev/null'],
    { env: { ...process.env, SHELL: '/bin/sh', TERM: 'xterm-256color' } });
  let output = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  try {
    await until(() => output.includes('messaggio iniziale'), () => 'anteprima dello storico');
    child.stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 60));
    child.stdin.write('\u001b[B');
    await new Promise(resolve => setTimeout(resolve, 60));
    child.stdin.write('\r');
    await until(() => historyReads >= 2 && output.includes('elaborazione'), () => 'chat pending');
    child.stdin.write('\u0012');
    await until(() => historyReads >= 3 && output.includes('conservata'), () => 'esito aggiornato');
    child.stdin.write('\u0011');
    const [code] = await once(child, 'exit');
    assert.equal(code, 0);
    assert.equal(posts, 0);
  } finally {
    child.kill();
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
});
