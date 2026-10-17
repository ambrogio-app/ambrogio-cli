import { hostname } from 'node:os';
import { argv, env, stderr, stdin, stdout } from 'node:process';
import { backendUrl, type ClientIdentity } from './backend.js';
import { runTerminalChat } from './tui.js';

function usage(): string {
  return 'Uso: npm start -- --server http://host:porta [--client-id identificativo]\n'
    + 'Oppure imposta AMBROGIO_URL e AMBROGIO_CLIENT_ID.\n';
}

type Options = { server?: string; clientId?: string };

function options(args: string[]): Options {
  if (args.includes('--help') || args.includes('-h')) {
    stdout.write(usage());
    process.exit(0);
  }
  const parsed: Options = {};
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    const key = name === '--server' ? 'server' : name === '--client-id' ? 'clientId' : undefined;
    if (!key || value === undefined || parsed[key] !== undefined) throw new Error(`Opzioni non valide.\n${usage()}`);
    parsed[key] = value;
  }
  return parsed;
}

function serverArgument(parsed: Options, environment: NodeJS.ProcessEnv): string {
  const value = parsed.server ?? environment.AMBROGIO_URL;
  if (!value) throw new Error(`Indica l’URL del backend.\n${usage()}`);
  return value;
}

function clientIdentity(parsed: Options, environment: NodeJS.ProcessEnv, host = hostname()): ClientIdentity {
  const clientId = parsed.clientId ?? environment.AMBROGIO_CLIENT_ID ?? `cli-${host}`;
  if (!clientId.trim()) throw new Error(`L’identificativo del client non può essere vuoto.\n${usage()}`);
  return { clientId, name: `Terminale ${host}` };
}

try {
  const parsed = options(argv.slice(2));
  const url = backendUrl(serverArgument(parsed, env));
  const identity = clientIdentity(parsed, env);
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('Apri il client in un terminale interattivo.');
  await runTerminalChat(url, identity);
} catch (error) {
  stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
