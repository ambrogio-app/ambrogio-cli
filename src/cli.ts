import { argv, env, stderr, stdin, stdout } from 'node:process';
import { backendUrl } from './backend.js';
import { runTerminalChat } from './tui.js';

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

try {
  const url = backendUrl(serverArgument(argv.slice(2), env));
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('Apri il client in un terminale interattivo.');
  await runTerminalChat(url);
} catch (error) {
  stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
