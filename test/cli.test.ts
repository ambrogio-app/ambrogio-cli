import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { hostname } from 'node:os';
import { readFile } from 'node:fs/promises';
import { interfaceLanguage, systemLanguage, texts, type Language, type Texts } from '../src/i18n.js';
import { startFakeBackend } from './fake-backend.js';

const executable = new URL('../src/cli.js', import.meta.url).pathname.replace('/test/', '/src/');

async function until(check: () => boolean, details: () => string): Promise<void> {
  const deadline = Date.now() + 7000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`Attesa scaduta: ${details()}`);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}

test('l’avvio richiede un URL esplicito', async () => {
  const child = spawn(process.execPath, [executable], { env: { ...process.env, AMBROGIO_URL: '', AMBROGIO_LANGUAGE: 'it' } });
  let error = '';
  child.stderr.setEncoding('utf8').on('data', chunk => { error += chunk; });
  const [code] = await once(child, 'exit');
  assert.equal(code, 2);
  assert.match(error, /Indica l’URL del backend/);
});

test('la chat resta aperta tra due turni e la barra laterale usa le anteprime HTTP', async () => {
  const paths: string[] = [];
  const turns: Array<{ text: string; conversationId?: string }> = [];
  const fake = await startFakeBackend({
    onTurn(turn) {
      turns.push({ text: turn.text, ...(turn.conversationId ? { conversationId: turn.conversationId } : {}) });
      turn.accept('c1', `t${turns.length}`);
      turn.transmit(['Risposta']);
      turn.send({ type: 'turn.completed', turnId: `t${turns.length}`, expectsReply: false });
    },
    http(request, response) {
      const path = request.url ?? '';
      paths.push(path);
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
          lastActivityAt: '2026-10-16T10:00:00.000Z', turns: turns.map((turn, index) => ({ id: `t${index + 1}`,
            text: turn.text, acceptedAt: '2026-10-16T10:00:00.000Z', status: 'answered', answer: 'Risposta',
            finishedAt: '2026-10-16T10:00:01.000Z' })) }));
      } else response.writeHead(404).end();
    },
  });
  const command = `stty cols 100 rows 30; exec ${process.execPath} ${executable} --server ${fake.url}`;
  const child = spawn('script', ['-qef', '-E', 'never', '-c', command, '/dev/null'],
    { env: { ...process.env, SHELL: '/bin/sh', TERM: 'xterm-256color', AMBROGIO_LANGUAGE: 'it' } });
  let output = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  try {
    await until(() => output.includes('Nuova chat') && output.includes('un vecchio'),
      () => `schermata iniziale; ${output.slice(-300)}`);
    assert.equal(fake.hellos.length, 0, 'the session opens with the first turn');
    child.stdin.write('ciao\r');
    await until(() => turns.length === 1 && paths.includes('/api/conversations/c1'), () => 'primo turno');
    await until(() => output.includes('ciao'), () => 'anteprima della nuova chat');
    child.stdin.write('ancora\r');
    await until(() => turns.length === 2 && paths.filter(path => path === '/api/conversations/c1').length === 2,
      () => 'secondo turno');
    assert.deepEqual(turns, [{ text: 'ciao' }, { text: 'ancora', conversationId: 'c1' }]);
    assert.equal(fake.hellos.length, 1, 'one session carries both turns');
    child.stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 80));
    child.stdin.write('\u001b[B');
    await new Promise(resolve => setTimeout(resolve, 80));
    child.stdin.write('\r');
    await until(() => paths.filter(path => path === '/api/conversations/c0').length >= 2,
      () => `apertura della chat scelta nella barra laterale; ${output.slice(-900)}`);
    assert.match(output, /Nuova chat/);
    assert.match(output, /un vecchio/);
    child.stdin.write('\u0011');
    const [code] = await once(child, 'exit');
    assert.equal(code, 0);
  } finally {
    child.kill();
    await fake.close();
  }
});

function withoutClientId(): NodeJS.ProcessEnv {
  const { AMBROGIO_CLIENT_ID: _unused, ...environment } = process.env;
  return environment;
}

async function helloOf(args: string[], environment: Record<string, string>) {
  const fake = await startFakeBackend({
    onTurn(turn) {
      turn.accept('c1', 't1');
      turn.send({ type: 'turn.completed', turnId: 't1', expectsReply: false });
    },
    http(_request, response) {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ items: [], nextCursor: null }));
    },
  });
  const quoted = args.map(arg => `'${arg}'`).join(' ');
  const command = `stty cols 100 rows 30; exec ${process.execPath} ${executable} --server ${fake.url} ${quoted}`;
  const child = spawn('script', ['-qef', '-E', 'never', '-c', command, '/dev/null'],
    { env: { ...withoutClientId(), AMBROGIO_LANGUAGE: 'it', ...environment, SHELL: '/bin/sh', TERM: 'xterm-256color' } });
  let output = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  try {
    await until(() => output.includes('Nuova chat') || output.includes('New chat'),
      () => `schermata iniziale; ${output.slice(-300)}`);
    child.stdin.write('ciao\r');
    await until(() => fake.hellos.length === 1, () => 'session.hello');
    child.stdin.write('\u0011');
    await once(child, 'exit');
    return fake.hellos[0];
  } finally {
    child.kill();
    await fake.close();
  }
}

// Verification: Prova dell'identità del client nella sessione
test('l’identità del client usa il nome host, la variabile e l’opzione', async () => {
  const name = `Terminale ${hostname()}`;
  const defaultHello = await helloOf([], {});
  assert.deepEqual(defaultHello, { type: 'session.hello', clientId: `cli-${hostname()}`, name });
  assert.deepEqual(await helloOf([], { AMBROGIO_LANGUAGE: 'en' }),
    { type: 'session.hello', clientId: `cli-${hostname()}`, name: `Terminal ${hostname()}` });
  assert.deepEqual(await helloOf([], { AMBROGIO_CLIENT_ID: 'cucina-tavolo' }),
    { type: 'session.hello', clientId: 'cucina-tavolo', name });
  assert.deepEqual(await helloOf(['--client-id', 'studio'], { AMBROGIO_CLIENT_ID: 'cucina-tavolo' }),
    { type: 'session.hello', clientId: 'studio', name });
  for (const [args, environment] of [[['--client-id', ''], {}], [[], { AMBROGIO_CLIENT_ID: '  ' }]] as const) {
    const child = spawn(process.execPath, [executable, '--server', 'http://127.0.0.1:9', ...args],
      { env: { ...withoutClientId(), AMBROGIO_LANGUAGE: 'it', ...environment } });
    let error = '';
    child.stderr.setEncoding('utf8').on('data', chunk => { error += chunk; });
    const [code] = await once(child, 'exit');
    assert.equal(code, 2);
    assert.match(error, /identificativo del client non può essere vuoto/);
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
    { env: { ...process.env, SHELL: '/bin/sh', TERM: 'xterm-256color', AMBROGIO_LANGUAGE: 'it' } });
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
  const fake = await startFakeBackend({ http(request, response) {
    response.setHeader('Content-Type', 'application/json');
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
  } });
  const command = `stty cols 100 rows 30; exec ${process.execPath} ${executable} --server ${fake.url}`;
  const child = spawn('script', ['-qef', '-E', 'never', '-c', command, '/dev/null'],
    { env: { ...process.env, SHELL: '/bin/sh', TERM: 'xterm-256color', AMBROGIO_LANGUAGE: 'it' } });
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
    assert.equal(fake.starts().length, 0, 'refreshing does not send a turn');
  } finally {
    child.kill();
    await fake.close();
  }
});

// Verification: Prova della lingua dell'interfaccia del client terminale
const contract = new URL('../../system-model/Contracts/TerminalConversation.md', import.meta.url);

function cleanEnvironment(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const { AMBROGIO_LANGUAGE: _l, AMBROGIO_URL: _u, LC_ALL: _a, LC_MESSAGES: _m, LANG: _g, ...rest } = process.env;
  return { ...rest, ...extra };
}

test('la lingua segue opzione, variabile e poi la lingua del sistema', () => {
  assert.deepEqual(interfaceLanguage('en', { AMBROGIO_LANGUAGE: 'it' }), { language: 'en', invalid: false });
  assert.deepEqual(interfaceLanguage('it', { AMBROGIO_LANGUAGE: 'xx' }), { language: 'it', invalid: false });
  assert.deepEqual(interfaceLanguage(undefined, { AMBROGIO_LANGUAGE: 'it', LANG: 'en_US.UTF-8' }),
    { language: 'it', invalid: false });
  assert.deepEqual(interfaceLanguage(undefined, { AMBROGIO_LANGUAGE: '', LANG: 'it_IT.UTF-8' }),
    { language: 'it', invalid: false });
  assert.deepEqual(interfaceLanguage('de', { LANG: 'it_IT.UTF-8' }), { language: 'it', invalid: true });
  assert.deepEqual(interfaceLanguage('de', { AMBROGIO_LANGUAGE: 'en', LANG: 'it_IT.UTF-8' }),
    { language: 'en', invalid: true });
  assert.deepEqual(interfaceLanguage(undefined, { AMBROGIO_LANGUAGE: 'IT', LANG: 'it_IT.UTF-8' }),
    { language: 'it', invalid: true });
  assert.equal(systemLanguage({}), 'en');
  assert.equal(systemLanguage({ LANG: 'C' }), 'en');
  assert.equal(systemLanguage({ LANG: 'POSIX' }), 'en');
  assert.equal(systemLanguage({ LANG: 'it' }), 'it');
  assert.equal(systemLanguage({ LANG: 'en_GB.UTF-8' }), 'en');
  assert.equal(systemLanguage({ LC_ALL: 'C.UTF-8', LANG: 'it_IT.UTF-8' }), 'en');
  assert.equal(systemLanguage({ LC_ALL: '', LC_MESSAGES: 'it_IT.UTF-8', LANG: 'en_US.UTF-8' }), 'it');
  assert.equal(systemLanguage({ LANGUAGE: 'it', LANG: 'en_US.UTF-8' }), 'en');
});

function rendered(catalogue: Texts): string[] {
  return Object.values(catalogue).flatMap(value => {
    if (typeof value === 'string') return [value];
    const text = (value as (placeholder: unknown) => string)('<placeholder>');
    return [text];
  }).flatMap(text => text.split('\n')).filter(line => line !== '');
}

async function contractSegments(): Promise<Record<Language, string[]>> {
  const markdown = await readFile(contract, 'utf8');
  const section = markdown.split('### Catalogo dei testi del client terminale')[1]?.split('#### Metadata')[0] ?? '';
  const segments: Record<Language, string[]> = { it: [], en: [] };
  for (const row of section.split('\n').filter(line => line.startsWith('| ') && !line.startsWith('| Uso '))) {
    const cells = row.split(/(?<!\\)\|/).slice(1, -1);
    const backticked = (cell: string) => [...cell.matchAll(/`([^`]+)`/g)].map(match => match[1]!.replaceAll('\\|', '|'));
    segments.it.push(...backticked(cells[1] ?? ''));
    segments.en.push(...backticked(cells[2] ?? ''));
  }
  return segments;
}

test('il catalogo del codice coincide con il contratto nelle due lingue', async () => {
  assert.deepEqual(Object.keys(texts.it), Object.keys(texts.en));
  const segments = await contractSegments();
  for (const language of ['it', 'en'] as const) {
    const placeholders = (line: string) => line.replace(/<placeholder>/g, '<?>');
    const expected = segments[language].map(segment => segment.replace(/<(host|testo|dettaglio|n)>/g, '<?>'));
    const lines = rendered(texts[language]).map(placeholders);
    for (const line of lines) assert(expected.includes(line), `${language}: «${line}» is not in the contract`);
    const fallback = texts[language].protocolError(undefined);
    for (const segment of expected) {
      assert(lines.includes(segment) || fallback.endsWith(segment), `${language}: «${segment}» is not in the code`);
    }
  }
});

async function runCli(args: string[], environment: NodeJS.ProcessEnv) {
  const child = spawn(process.execPath, [executable, ...args], { env: environment });
  let output = '';
  let error = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  child.stderr.setEncoding('utf8').on('data', chunk => { error += chunk; });
  const [code] = await once(child, 'exit');
  return { code, output, error };
}

test('l’avvio usa la lingua scelta e rifiuta una lingua non supportata', async () => {
  let result = await runCli(['--language', 'xx'], cleanEnvironment({ AMBROGIO_LANGUAGE: 'en' }));
  assert.equal(result.code, 2);
  assert.equal(result.error, `Invalid options.\n${texts.en.usage}\n`);
  result = await runCli([], cleanEnvironment({ AMBROGIO_LANGUAGE: 'de', LANG: 'it_IT.UTF-8' }));
  assert.equal(result.code, 2);
  assert.equal(result.error, `Opzioni non valide.\n${texts.it.usage}\n`);
  result = await runCli([], cleanEnvironment({ LANG: 'en_US.UTF-8' }));
  assert.equal(result.code, 2);
  assert.match(result.error, /^Specify the backend URL\.\nUsage:/);
  result = await runCli([], cleanEnvironment({ LANG: 'it_IT.UTF-8' }));
  assert.match(result.error, /^Indica l’URL del backend\.\nUso:/);
  result = await runCli([], cleanEnvironment());
  assert.match(result.error, /^Specify the backend URL\./);
  result = await runCli(['--language', 'it'], cleanEnvironment({ AMBROGIO_LANGUAGE: 'en' }));
  assert.match(result.error, /^Indica l’URL del backend\./);
  result = await runCli(['--help', '--language', 'en'], cleanEnvironment({ LANG: 'it_IT.UTF-8' }));
  assert.equal(result.code, 0);
  assert.equal(result.output, texts.en.usage);
  result = await runCli(['--help'], cleanEnvironment({ AMBROGIO_LANGUAGE: 'it' }));
  assert.equal(result.output, texts.it.usage);
});

test('la schermata in inglese mostra i testi inglesi e il messaggio del backend invariato', async () => {
  const fake = await startFakeBackend({
    onTurn(turn) {
      turn.send({ type: 'turn.rejected', requestId: turn.requestId, reason: 'occupied',
        message: 'Conversazione occupata.' });
    },
    http(_request, response) {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ items: [], nextCursor: null }));
    },
  });
  const command = `stty cols 100 rows 30; exec ${process.execPath} ${executable} --server ${fake.url}`;
  const child = spawn('script', ['-qef', '-E', 'never', '-c', command, '/dev/null'],
    { env: cleanEnvironment({ LANG: 'en_US.UTF-8', SHELL: '/bin/sh', TERM: 'xterm-256color' }) });
  let output = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  const waitFor = async (check: () => boolean, what: string) => {
    const deadline = Date.now() + 7000;
    while (!check()) {
      if (Date.now() > deadline) throw new Error(`Timed out: ${what}; ${output.slice(-400)}`);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  };
  try {
    await waitFor(() => output.includes('New chat') && output.includes('^Q quit')
      && output.includes('Type a message and press Enter'), 'English screen');
    child.stdin.write('hello\r');
    await waitFor(() => output.includes('Error: Conversazione occupata.'), 'backend message');
    await waitFor(() => output.includes('The turn ended with an error.'), 'English status');
    assert.doesNotMatch(output, /Nuova chat|Scrivi un messaggio|Errore:/);
    assert.equal(fake.hellos[0]?.name, `Terminal ${hostname()}`);
    child.stdin.write('\u0011');
    const [code] = await once(child, 'exit');
    assert.equal(code, 0);
  } finally {
    child.kill();
    await fake.close();
  }
});
