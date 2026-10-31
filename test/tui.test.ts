import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ServerResponse } from 'node:http';
import { startFakeBackend } from './fake-backend.js';
import { keys, startTerminal, type Screen } from './terminal.js';

// Verifications: Prova della schermata conversazionale persistente;
// Prova della ripartenza dell'elenco aggiornato; Prova del rifiuto locale del turno testuale nel client terminale;
// Prova di un solo turno alla volta per conversazione nel client terminale.
const executable = new URL('../src/cli.js', import.meta.url).pathname;
const environment = { ...process.env, AMBROGIO_LANGUAGE: 'it' };
const at = '2026-10-16T10:00:00.000Z';
const tooSmall = ['Allarga il terminale ad almeno 70 colonne e 14 righe.', 'La chat corrente resta aperta.'];

function json(response: ServerResponse, body: unknown, status = 200): void {
  response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
}

function problem(response: ServerResponse, type: string, title: string, status: number): void {
  response.writeHead(status, { 'Content-Type': 'application/problem+json' }).end(JSON.stringify({ type, title, status }));
}

function conversation(id: string, texts: readonly string[]) {
  return { id, createdAt: at, lastActivityAt: at, turns: texts.map((text, index) => ({ id: `t${index + 1}`, text,
    acceptedAt: at, status: 'answered', answer: 'Risposta', finishedAt: at })) };
}

/** The sidebar width the client computes for a terminal of the given width. */
function side(cols: number): number { return Math.min(34, Math.max(24, Math.floor(cols * 0.29))); }

/** The labels shown in the sidebar list, top to bottom. */
function sidebar(screen: Screen): string[] {
  const width = side(screen.cols);
  return screen.lines().slice(3, screen.rows - 4).map(line => line.slice(0, width).trim()).filter(Boolean);
}

/** The screen text with wrapped lines joined, to read a message regardless of the terminal width. */
function words(screen: Screen): string {
  return screen.lines().map(line => line.trim()).filter(Boolean).join(' ');
}

function twoPanels(screen: Screen): boolean {
  const width = side(screen.cols);
  return screen.lines()[5]?.[width] === '│'
    && (screen.lines()[screen.rows - 4] ?? '').includes('Scrivi un messaggio e premi Invio')
    && (screen.lines()[screen.rows - 1] ?? '').includes('^Q esci');
}

test('il ridimensionamento ricalcola i pannelli e sotto 70×14 chiede di allargare senza perdere la chat', async () => {
  const turns: Array<{ text: string; conversationId?: string }> = [];
  const fake = await startFakeBackend({
    onTurn(turn) {
      turns.push({ text: turn.text, ...(turn.conversationId ? { conversationId: turn.conversationId } : {}) });
      turn.accept('c1', `t${turns.length}`);
      turn.transmit(['Risposta']);
      turn.send({ type: 'turn.completed', turnId: `t${turns.length}`, expectsReply: false });
    },
    http(request, response) {
      if (request.url === '/api/v1/conversations') json(response, { items: [], nextCursor: null });
      else if (request.url === '/api/v1/conversations/c1') json(response, conversation('c1', turns.map(turn => turn.text)));
      else problem(response, '/problems/conversation-not-found', 'Conversation not found', 404);
    },
  });
  const terminal = await startTerminal(executable, ['--server', fake.url], { cols: 100, rows: 30, env: environment });
  try {
    await terminal.waitFor(screen => twoPanels(screen) && sidebar(screen)[0] === 'Nuova chat', 'schermata 100×30');
    terminal.write('ciao\r');
    await terminal.waitFor(screen => screen.text().includes('Tu: ciao') && screen.text().includes('Ambrogio: Risposta')
      && screen.text().includes('Risposta conservata.'), 'primo turno');

    for (const [cols, rows] of [[80, 24], [120, 40]] as const) {
      terminal.resize(cols, rows);
      await terminal.waitFor(screen => twoPanels(screen) && screen.text().includes('Tu: ciao')
        && sidebar(screen)[0] === 'ciao', `pannelli ricalcolati a ${cols}×${rows}`);
      assert.equal(terminal.screen.lines()[5]?.indexOf('│'), side(cols), `separator at ${cols}×${rows}`);
    }

    for (const [cols, rows] of [[69, 30], [100, 13], [40, 10]] as const) {
      terminal.resize(cols, rows);
      await terminal.waitFor(screen => tooSmall.every(line => words(screen).includes(line)), `avviso a ${cols}×${rows}`);
      const text = terminal.screen.text();
      assert.doesNotMatch(text, /Tu: ciao|Scrivi un messaggio e premi Invio|│/, `no panels at ${cols}×${rows}`);
    }

    terminal.resize(70, 14);
    await terminal.waitFor(screen => twoPanels(screen) && screen.text().includes('Tu: ciao')
      && !screen.text().includes(tooSmall[0]!), 'pannelli a 70×14');

    terminal.resize(100, 30);
    await terminal.waitFor(screen => twoPanels(screen) && screen.text().includes('Tu: ciao'), 'chat ritrovata');
    terminal.write('ancora\r');
    await terminal.waitFor(screen => screen.text().includes('Tu: ancora') && turns.length === 2, 'secondo turno');
    assert.deepEqual(turns, [{ text: 'ciao' }, { text: 'ancora', conversationId: 'c1' }]);
    assert.equal(fake.hellos.length, 1);
    assert.equal(await terminal.quit(), 0);
  } finally {
    terminal.dispose();
    await fake.close();
  }
});

test('un testo vuoto o di soli spazi è rifiutato con il messaggio del catalogo senza aprire la sessione', async () => {
  const turns: string[] = [];
  const fake = await startFakeBackend({
    onTurn(turn) {
      turns.push(turn.text);
      turn.accept('c1', 't1');
      turn.transmit(['Risposta']);
      turn.send({ type: 'turn.completed', turnId: 't1', expectsReply: false });
    },
    http(request, response) {
      if (request.url === '/api/v1/conversations') json(response, { items: [], nextCursor: null });
      else if (request.url === '/api/v1/conversations/c1') json(response, conversation('c1', turns));
      else problem(response, '/problems/conversation-not-found', 'Conversation not found', 404);
    },
  });
  const terminal = await startTerminal(executable, ['--server', fake.url], { cols: 100, rows: 30, env: environment });
  const newChat = '\u000e';
  try {
    await terminal.waitFor(screen => twoPanels(screen) && screen.text().includes('Conversazioni aggiornate.'), 'schermata');
    // The screen rejects with the same check as the backend client, whose tests cover the 64 KiB limit:
    // typing more than 64 KiB key by key into the simulated terminal takes too long for the suite.
    for (const [text, message] of [['', 'Scrivi un messaggio non vuoto.'], ['   ', 'Scrivi un messaggio non vuoto.']] as const) {
      terminal.write(newChat);
      await terminal.waitFor(screen => screen.text().includes('Nuova chat pronta.'), 'nuova chat');
      terminal.write(`${text}\r`);
      await terminal.waitFor(screen => screen.text().includes(message), `rifiuto di ${text.length} caratteri`);
      assert.doesNotMatch(terminal.screen.text(), /Tu:|Invio non riuscito|Ambrogio sta rispondendo/);
      assert.equal(sidebar(terminal.screen)[0], 'Nuova chat');
      assert.equal(fake.hellos.length, 0, 'no session is opened for a rejected text');
    }
    terminal.write(newChat);
    await terminal.waitFor(screen => screen.text().includes('Nuova chat pronta.'), 'nuova chat');
    terminal.write('ciao\r');
    await terminal.waitFor(screen => screen.text().includes('Risposta conservata.'), 'turno ammesso');
    assert.deepEqual(turns, ['ciao']);
    assert.equal(fake.hellos.length, 1);
    assert.equal(await terminal.quit(), 0);
  } finally {
    terminal.dispose();
    await fake.close();
  }
});

test('una conversazione con storico non disponibile resta selezionabile con l’identificativo abbreviato', async () => {
  const unavailable = '0123456789abcdef-unavailable';
  let unavailableReads = 0;
  const fake = await startFakeBackend({ http(request, response) {
    if (request.url === '/api/v1/conversations') {
      json(response, { items: [{ id: 'c1', lastActivityAt: at }, { id: unavailable, lastActivityAt: at }], nextCursor: null });
    } else if (request.url === '/api/v1/conversations/c1') json(response, conversation('c1', ['messaggio c1']));
    else if (request.url === `/api/v1/conversations/${unavailable}`) {
      unavailableReads += 1;
      if (unavailableReads === 1) problem(response, 'about:blank', 'Internal Server Error', 500);
      else json(response, conversation(unavailable, ['messaggio recuperato']));
    } else problem(response, '/problems/conversation-not-found', 'Conversation not found', 404);
  } });
  const terminal = await startTerminal(executable, ['--server', fake.url], { cols: 100, rows: 30, env: environment });
  try {
    await terminal.waitFor(screen => sidebar(screen).join('|') === `Nuova chat|messaggio c1|${unavailable.slice(0, 8)}`,
      'identificativo abbreviato nella barra laterale');
    assert.equal(unavailableReads, 1);
    assert.doesNotMatch(terminal.screen.text(), /0123456789/);
    await terminal.keys(keys.tab, keys.down, keys.down, keys.enter);
    await terminal.waitFor(screen => screen.text().includes('Tu: messaggio recuperato')
      && screen.text().includes('Chat aperta.'), 'apertura della conversazione');
    assert.equal(unavailableReads, 2);
    assert.equal(await terminal.quit(), 0);
  } finally {
    terminal.dispose();
    await fake.close();
  }
});

test('l’aggiornamento presenta l’ordine corrente dell’archivio e prosegue con il nuovo riferimento', async () => {
  const lists: string[] = [];
  let archive = 1;
  const pages: Record<number, Record<string, { items: string[]; nextCursor: string | null }>> = {
    1: { '': { items: ['c1'], nextCursor: 'p1' }, p1: { items: ['c2'], nextCursor: null } },
    2: { '': { items: ['c3', 'c2'], nextCursor: 'p2' }, p2: { items: ['c1'], nextCursor: null } },
  };
  const fake = await startFakeBackend({ http(request, response) {
    const url = new URL(request.url ?? '', 'http://localhost');
    if (url.pathname === '/api/v1/conversations') {
      lists.push(url.search);
      const page = pages[archive]?.[url.searchParams.get('cursor') ?? ''];
      if (!page) { problem(response, '/problems/invalid-pagination', 'Invalid pagination request', 400); return; }
      json(response, { items: page.items.map(id => ({ id, lastActivityAt: at })), nextCursor: page.nextCursor });
    } else {
      const id = url.pathname.split('/').at(-1) ?? '';
      json(response, conversation(id, [`messaggio ${id}`]));
    }
  } });
  const terminal = await startTerminal(executable, ['--server', fake.url], { cols: 100, rows: 30, env: environment });
  const shown = (expected: string) => terminal.waitFor(screen => sidebar(screen).join('|') === expected,
    `barra laterale ${expected}`);
  try {
    await shown('Nuova chat|messaggio c1');
    terminal.write(keys.more);
    await shown('Nuova chat|messaggio c1|messaggio c2');

    archive = 2;
    terminal.write(keys.refresh);
    await shown('Nuova chat|messaggio c3|messaggio c2');
    await terminal.waitFor(screen => screen.text().includes('Conversazioni aggiornate.'), 'stato aggiornato');
    terminal.write(keys.more);
    await shown('Nuova chat|messaggio c3|messaggio c2|messaggio c1');
    assert.deepEqual(lists, ['', '?cursor=p1', '', '?cursor=p2']);
    assert.equal(await terminal.quit(), 0);
  } finally {
    terminal.dispose();
    await fake.close();
  }
});

test('durante un turno la sua chat non invia altri turni, mentre una nuova chat invia il proprio', async () => {
  const turns: Array<{ text: string; conversationId?: string }> = [];
  let releaseFirst: (() => void) | undefined;
  const fake = await startFakeBackend({
    onTurn(turn) {
      turns.push({ text: turn.text, ...(turn.conversationId ? { conversationId: turn.conversationId } : {}) });
      const turnId = `t${turns.length}`;
      if (turn.text === 'primo') {
        turn.accept('c1', turnId);
        turn.transmit(['Parziale']);
        releaseFirst = () => turn.send({ type: 'turn.completed', turnId, expectsReply: false });
        return;
      }
      turn.accept(turn.conversationId ?? 'c2', turnId);
      turn.transmit(['Risposta']);
      turn.send({ type: 'turn.completed', turnId, expectsReply: false });
    },
    http(request, response) {
      const id = request.url?.split('/').at(-1);
      if (request.url === '/api/v1/conversations') json(response, { items: [], nextCursor: null });
      else if (id === 'c1' || id === 'c2') {
        json(response, conversation(id, turns.filter(turn => (turn.conversationId ?? (turn.text === 'primo' ? 'c1' : 'c2')) === id)
          .map(turn => turn.text)));
      } else problem(response, '/problems/conversation-not-found', 'Conversation not found', 404);
    },
  });
  const terminal = await startTerminal(executable, ['--server', fake.url], { cols: 100, rows: 30, env: environment });
  const settle = () => new Promise(resolve => setTimeout(resolve, 400));
  try {
    await terminal.waitFor(screen => twoPanels(screen) && sidebar(screen)[0] === 'Nuova chat', 'schermata iniziale');
    terminal.write('primo\r');
    await terminal.waitFor(screen => screen.text().includes('Ambrogio: Parziale'), 'risposta in corso');
    terminal.write('secondo\r');
    await settle();
    assert.equal(fake.starts().length, 1, 'no turn leaves the chat whose turn is in progress');

    terminal.write('\u000e');
    await terminal.waitFor(screen => sidebar(screen).join('|') === 'Nuova chat|primo', 'nuova chat durante il turno');
    terminal.write('altra\r');
    await terminal.waitFor(screen => screen.text().includes('Tu: altra') && screen.text().includes('Risposta conservata.'),
      'turno della nuova chat');
    assert.deepEqual(turns, [{ text: 'primo' }, { text: 'altra' }]);

    await terminal.keys(keys.tab, keys.down, keys.enter);
    await terminal.waitFor(screen => screen.text().includes('Ambrogio: Parziale'), 'ritorno alla chat in risposta');
    terminal.write('terzo\r');
    await settle();
    assert.equal(fake.starts().length, 2, 'the chat whose turn is in progress still sends nothing');

    releaseFirst?.();
    await terminal.waitFor(screen => screen.text().includes('Ambrogio: Risposta')
      && screen.text().includes('Risposta conservata.'), 'esito del primo turno');
    // The text written during the turn stays in the field and leaves with the next Enter.
    terminal.write('\r');
    await terminal.waitFor(() => turns.length === 3, 'turno dopo l’esito');
    assert.deepEqual(turns[2], { text: 'terzo', conversationId: 'c1' });
    assert.equal(await terminal.quit(), 0);
  } finally {
    terminal.dispose();
    await fake.close();
  }
});
