import { createInterface } from 'node:readline/promises';
import { clearLine, cursorTo } from 'node:readline';
import { stdin, stdout, stderr, argv, env } from 'node:process';
import { AmbrogioBackend, backendUrl, type Conversation, type ConversationPage, type TurnResult } from './backend.js';

function usage(): string {
  return 'Uso: npm start -- --server http://host:porta\nOppure imposta AMBROGIO_URL.\n';
}

function serverArgument(args: string[], environment: NodeJS.ProcessEnv): string {
  if (args.includes('--help') || args.includes('-h')) {
    stdout.write(usage());
    process.exit(0);
  }
  let option: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== '--server' || !args[index + 1] || option || args.length !== 2) {
      throw new Error(`Opzioni non valide.\n${usage()}`);
    }
    option = args[index + 1];
    index += 1;
  }
  const value = option ?? environment.AMBROGIO_URL;
  if (!value) throw new Error(`Indica l’URL del backend.\n${usage()}`);
  return value;
}

function showHistory(conversation: Conversation): void {
  stdout.write(`\nConversazione ${conversation.id}\n`);
  if (conversation.turns.length === 0) stdout.write('Nessun turno conservato.\n');
  for (const turn of conversation.turns) {
    stdout.write(`\nTu: ${turn.text}\n`);
    switch (turn.status) {
      case 'pending': stdout.write('In elaborazione. Aggiorna manualmente più tardi.\n'); break;
      case 'answered': stdout.write(`Ambrogio: ${turn.answer}\n`); break;
      case 'failed': stdout.write(`Errore: ${turn.error}\n`); break;
      case 'interrupted': stdout.write('Turno interrotto.\n'); break;
    }
  }
}

function showPage(page: ConversationPage): void {
  stdout.write('\nConversazioni conservate:\n');
  if (page.items.length === 0) stdout.write('Nessuna conversazione.\n');
  page.items.forEach((item, index) => stdout.write(`${index + 1}. ${item.id} · ${item.lastActivityAt}\n`));
  if (page.nextCursor) stdout.write('Altre conversazioni disponibili (menu 3).\n');
}

function liveRenderer(): { delta: (text: string) => void; finish: (result: TurnResult) => void } {
  let text = '';
  let showing = false;
  const interactive = Boolean(stdout.isTTY);
  function clear(): void {
    if (!showing) return;
    cursorTo(stdout, 0);
    clearLine(stdout, 0);
    showing = false;
  }
  return {
    delta(chunk) {
      text += chunk;
      if (!interactive) return;
      const width = Math.max(20, (stdout.columns ?? 80) - 22);
      const preview = text.replace(/\s+/g, ' ').slice(-width);
      cursorTo(stdout, 0);
      clearLine(stdout, 0);
      stdout.write(`Ambrogio (in corso): ${preview}`);
      showing = true;
    },
    finish(result) {
      clear();
      if (result.status === 'answered') stdout.write(`Ambrogio: ${result.answer}\n`);
      else if (result.status === 'failed') stdout.write(`Errore: ${result.error}\n`);
      else stdout.write('Risposta interrotta. Aggiorna manualmente la conversazione più tardi.\n');
    },
  };
}

async function main(): Promise<void> {
  const backend = new AmbrogioBackend(backendUrl(serverArgument(argv.slice(2), env)));
  const prompt = createInterface({ input: stdin, output: stdout });
  let currentId: string | null = null;
  let currentPage: ConversationPage | null = null;
  try {
    stdout.write('Ambrogio · client terminale\n');
    while (true) {
      stdout.write(`\n${currentId ? `Conversazione aperta: ${currentId}\n` : ''}`);
      stdout.write('1 Nuova chat · 2 Elenco · 3 Pagina successiva · 4 Apri · 5 Aggiorna · 6 Invia turno · 0 Esci\n');
      let choice: string;
      try { choice = (await prompt.question('Scelta: ')).trim(); } catch { break; }
      if (choice === '0') break;
      try {
        if (choice === '1' || choice === '6') {
          if (choice === '6' && !currentId) {
            stdout.write('Apri una conversazione o inizia una nuova chat.\n');
            continue;
          }
          const message = await prompt.question('Tu: ');
          if (!message.trim()) { stdout.write('Scrivi un messaggio non vuoto.\n'); continue; }
          const renderer = liveRenderer();
          const result = await backend.send(message, choice === '1' ? null : currentId, renderer.delta);
          renderer.finish(result);
          if (result.conversationId) currentId = result.conversationId;
          currentPage = null;
        } else if (choice === '2') {
          currentPage = await backend.list();
          showPage(currentPage);
        } else if (choice === '3') {
          if (!currentPage?.nextCursor) { stdout.write('Nessuna pagina successiva disponibile.\n'); continue; }
          currentPage = await backend.list(currentPage.nextCursor);
          showPage(currentPage);
        } else if (choice === '4') {
          const input = (await prompt.question('Numero nell’elenco o ID conversazione: ')).trim();
          const index = /^\d+$/.test(input) ? Number(input) - 1 : -1;
          const id = index >= 0 ? currentPage?.items[index]?.id : input;
          if (!id) { stdout.write('Conversazione non selezionata.\n'); continue; }
          const conversation = await backend.history(id);
          currentId = conversation.id;
          showHistory(conversation);
        } else if (choice === '5') {
          if (currentId) showHistory(await backend.history(currentId));
          else { currentPage = await backend.list(); showPage(currentPage); }
        } else {
          stdout.write('Scegli un numero del menu.\n');
        }
      } catch (error) {
        stdout.write(`Errore: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
  } finally {
    prompt.close();
  }
}

main().catch(error => {
  stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
});
