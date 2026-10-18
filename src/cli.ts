import { hostname } from 'node:os';
import { argv, env, stderr, stdin, stdout } from 'node:process';
import { backendUrl, type ClientIdentity } from './backend.js';
import { interfaceLanguage, texts, type Texts } from './i18n.js';
import { runTerminalChat } from './tui.js';

type Options = { server?: string; clientId?: string; language?: string };

const names: Record<string, keyof Options> = { '--server': 'server', '--client-id': 'clientId', '--language': 'language' };

/** Parsed options, or `undefined` when they are malformed. */
function options(args: string[]): Options | undefined {
  const parsed: Options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = names[args[index] ?? ''];
    const value = args[index + 1];
    if (!key || value === undefined || parsed[key] !== undefined) return undefined;
    parsed[key] = value;
  }
  return parsed;
}

/** The value given to `--language`, if any, even when the other options are malformed. */
function languageArgument(args: string[]): string | undefined {
  const index = args.indexOf('--language');
  return index >= 0 ? args[index + 1] : undefined;
}

function serverArgument(parsed: Options, environment: NodeJS.ProcessEnv, t: Texts): string {
  const value = parsed.server ?? environment.AMBROGIO_URL;
  if (!value) throw new Error(`${t.missingUrl}\n${t.usage}`);
  return value;
}

function clientIdentity(parsed: Options, environment: NodeJS.ProcessEnv, t: Texts, host = hostname()): ClientIdentity {
  const clientId = parsed.clientId ?? environment.AMBROGIO_CLIENT_ID ?? `cli-${host}`;
  if (!clientId.trim()) throw new Error(`${t.emptyClientId}\n${t.usage}`);
  return { clientId, name: t.clientName(host) };
}

const args = argv.slice(2);
const choice = interfaceLanguage(languageArgument(args), env);
const t = texts[choice.language];
try {
  if (args.includes('--help') || args.includes('-h')) {
    stdout.write(t.usage);
    process.exit(0);
  }
  const parsed = options(args);
  if (!parsed || choice.invalid) throw new Error(`${t.invalidOptions}\n${t.usage}`);
  const url = backendUrl(serverArgument(parsed, env, t), t);
  const identity = clientIdentity(parsed, env, t);
  if (!stdin.isTTY || !stdout.isTTY) throw new Error(t.notInteractive);
  await runTerminalChat(url, identity, t);
} catch (error) {
  stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
