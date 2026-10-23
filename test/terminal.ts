import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * A minimal character grid that interprets the escape sequences Terminal Kit writes, so tests can
 * read what a person would see on the screen instead of searching the raw output stream.
 */
export class Screen {
  private grid: string[][] = [];
  private row = 0;
  private col = 0;
  private pending = '';

  constructor(public cols: number, public rows: number) { this.clear(); }

  resize(cols: number, rows: number): void {
    this.grid = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => this.grid[row]?.[col] ?? ' '));
    this.cols = cols;
    this.rows = rows;
    this.row = Math.min(this.row, rows - 1);
    this.col = Math.min(this.col, cols - 1);
  }

  lines(): string[] { return this.grid.map(cells => cells.join('').trimEnd()); }

  text(): string { return this.lines().join('\n'); }

  write(data: string): void {
    const input = this.pending + data;
    this.pending = '';
    let index = 0;
    while (index < input.length) {
      const char = input[index]!;
      if (char === '\x1b') {
        const consumed = this.escape(input, index);
        if (consumed === 0) { this.pending = input.slice(index); return; }
        index += consumed;
        continue;
      }
      if (char === '\r') this.col = 0;
      else if (char === '\n') this.lineFeed();
      else if (char === '\b') this.col = Math.max(0, this.col - 1);
      else if (char >= ' ' && char !== '\x7f') this.put(char);
      index += 1;
    }
  }

  private clear(): void {
    this.grid = Array.from({ length: this.rows }, () => Array<string>(this.cols).fill(' '));
  }

  private put(char: string): void {
    if (this.col < this.cols && this.row < this.rows) this.grid[this.row]![this.col] = char;
    this.col += 1;
  }

  private lineFeed(): void {
    if (this.row < this.rows - 1) { this.row += 1; return; }
    this.grid.shift();
    this.grid.push(Array<string>(this.cols).fill(' '));
  }

  private erase(row: number, from: number, to: number): void {
    const cells = this.grid[row];
    if (!cells) return;
    for (let col = Math.max(0, from); col < Math.min(this.cols, to); col += 1) cells[col] = ' ';
  }

  /** Interprets one escape sequence and returns its length, or 0 when it is incomplete. */
  private escape(input: string, start: number): number {
    const next = input[start + 1];
    if (next === undefined) return 0;
    if (next === '[') {
      let end = start + 2;
      while (end < input.length && !/[\x40-\x7e]/.test(input[end]!)) end += 1;
      if (end >= input.length) return 0;
      this.csi(input.slice(start + 2, end), input[end]!);
      return end - start + 1;
    }
    if (next === ']') {
      const bell = input.indexOf('\x07', start);
      const terminator = input.indexOf('\x1b\\', start + 2);
      const ends = [bell === -1 ? Infinity : bell + 1, terminator === -1 ? Infinity : terminator + 2];
      const end = Math.min(...ends);
      return end === Infinity ? 0 : end - start;
    }
    if ('()#'.includes(next)) return input.length < start + 3 ? 0 : 3;
    return 2;
  }

  private csi(parameters: string, final: string): void {
    if (/^[?>=!]/.test(parameters)) return;
    const values = parameters.split(';').map(value => Number.parseInt(value, 10));
    const first = Number.isNaN(values[0]) ? undefined : values[0];
    const count = Math.max(1, first ?? 1);
    switch (final) {
      case 'H': case 'f':
        this.row = Math.min(this.rows - 1, Math.max(0, (first ?? 1) - 1));
        this.col = Math.min(this.cols - 1, Math.max(0, (Number.isNaN(values[1]) ? 1 : values[1] ?? 1) - 1));
        break;
      case 'A': this.row = Math.max(0, this.row - count); break;
      case 'B': this.row = Math.min(this.rows - 1, this.row + count); break;
      case 'C': this.col = Math.min(this.cols - 1, this.col + count); break;
      case 'D': this.col = Math.max(0, this.col - count); break;
      case 'G': this.col = Math.min(this.cols - 1, count - 1); break;
      case 'd': this.row = Math.min(this.rows - 1, count - 1); break;
      case 'X': this.erase(this.row, this.col, this.col + count); break;
      case 'K':
        if ((first ?? 0) === 0) this.erase(this.row, this.col, this.cols);
        else if (first === 1) this.erase(this.row, 0, this.col + 1);
        else this.erase(this.row, 0, this.cols);
        break;
      case 'J':
        if ((first ?? 0) === 0) {
          this.erase(this.row, this.col, this.cols);
          for (let row = this.row + 1; row < this.rows; row += 1) this.erase(row, 0, this.cols);
        } else if (first === 1) {
          for (let row = 0; row < this.row; row += 1) this.erase(row, 0, this.cols);
          this.erase(this.row, 0, this.col + 1);
        } else this.clear();
        break;
      default: break;
    }
  }
}

export type Terminal = Awaited<ReturnType<typeof startTerminal>>;

/**
 * Runs the client in a pseudo-terminal created by `script`, mirrors its output on a `Screen` and
 * resizes the pseudo-terminal with `stty`, which makes the kernel deliver SIGWINCH to the client.
 */
export async function startTerminal(executable: string, args: readonly string[], options: Readonly<{
  cols: number; rows: number; env: NodeJS.ProcessEnv;
}>) {
  const directory = mkdtempSync(join(tmpdir(), 'ambrogio-cli-tty-'));
  const ttyFile = join(directory, 'tty');
  const quoted = [executable, ...args].map(arg => `'${arg.replaceAll("'", "'\\''")}'`).join(' ');
  const command = `stty cols ${options.cols} rows ${options.rows}; tty > '${ttyFile}'; exec '${process.execPath}' ${quoted}`;
  const child = spawn('script', ['-qef', '-E', 'never', '-c', command, '/dev/null'],
    { env: { ...options.env, SHELL: '/bin/sh', TERM: 'xterm-256color' } });
  const screen = new Screen(options.cols, options.rows);
  let output = '';
  child.stdout.setEncoding('utf8').on('data', (chunk: string) => { output += chunk; screen.write(chunk); });
  const exited = once(child, 'exit');
  let tty = '';

  async function waitFor(check: (screen: Screen) => boolean, what: string): Promise<void> {
    const deadline = Date.now() + 7000;
    while (!check(screen)) {
      if (Date.now() > deadline) throw new Error(`Attesa scaduta: ${what}\n${screen.text()}`);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }

  await waitFor(() => {
    try { tty = readFileSync(ttyFile, 'utf8').trim(); } catch { /* Not written yet. */ }
    return tty.startsWith('/dev/');
  }, 'terminale del client');

  return {
    screen,
    output: () => output,
    waitFor,
    write(data: string): void { child.stdin.write(data); },
    async keys(...sequence: string[]): Promise<void> {
      for (const key of sequence) {
        child.stdin.write(key);
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    },
    resize(cols: number, rows: number): void {
      screen.resize(cols, rows);
      execFileSync('stty', ['-F', tty, 'cols', String(cols), 'rows', String(rows)]);
    },
    /** Quits with Ctrl+Q and returns the exit code. */
    async quit(): Promise<number | null> {
      child.stdin.write('\u0011');
      const [code] = await exited;
      return code as number | null;
    },
    dispose(): void {
      child.kill();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

export const keys = { tab: '\t', down: '\u001b[B', enter: '\r', refresh: '\u0012', more: '\u000c' } as const;
