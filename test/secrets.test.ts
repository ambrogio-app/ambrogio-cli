import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { accessSync, constants, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Verifications: Prova dell'hook pre-commit dei segreti;
// Prova della configurazione della scansione dei segreti in CI.
// Compiled to dist/test/, so the repository root is two levels up.
const root = fileURLToPath(new URL('../../', import.meta.url));
const hooks = join(root, '.githooks');

/** A GitHub token shape that gitleaks recognises, assembled at runtime so no secret is versioned. */
function fakeToken(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return ['gh', 'p_', ...[...randomBytes(36)].map(byte => alphabet[byte % alphabet.length])].join('');
}

function executable(name: string, path = process.env.PATH ?? ''): string | undefined {
  for (const directory of path.split(delimiter).filter(Boolean)) {
    try { accessSync(join(directory, name), constants.X_OK); return join(directory, name); }
    catch { /* Not in this directory. */ }
  }
  return undefined;
}

/** An isolated Git repository in a temporary directory, ignoring the user's Git configuration. */
function repository(t: { after(fn: () => void): void }) {
  const directory = mkdtempSync(join(tmpdir(), 'ambrogio-cli-secrets-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const environment = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.com',
    GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.com' };
  const run = (command: string, args: readonly string[], env: NodeJS.ProcessEnv = environment) => {
    const result = spawnSync(command, args, { cwd: directory, env, encoding: 'utf8' });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  };
  const git = (args: readonly string[], env?: NodeJS.ProcessEnv) => run('git', args, env);
  assert.equal(git(['init', '--quiet']).status, 0);
  const commits = () => Number(git(['rev-list', '--count', '--all']).output.trim() || '0');
  const stage = (name: string, content: string) => {
    writeFileSync(join(directory, name), content);
    assert.equal(git(['add', name]).status, 0);
  };
  return { directory, environment, run, git, commits, stage };
}

function requireGitleaks(): void {
  assert(executable('gitleaks'), 'gitleaks 8.30.1 must be on PATH to run this test (CI installs it in the checks job)');
}

test('the pre-commit hook blocks a staged secret without printing it and lets a clean commit through', t => {
  requireGitleaks();
  const repo = repository(t);
  assert.equal(repo.git(['config', 'core.hooksPath', hooks]).status, 0);
  const token = fakeToken();
  repo.stage('settings.txt', `token = "${token}"\n`);
  const blocked = repo.git(['commit', '--quiet', '-m', 'add settings']);
  assert.notEqual(blocked.status, 0, 'the commit with a secret must fail');
  assert.equal(repo.commits(), 0, 'no commit is created');
  assert.match(blocked.output, /leaks found: 1/);
  assert(!blocked.output.includes(token), 'the hook output must not contain the secret');

  assert.equal(repo.git(['rm', '--cached', '--quiet', 'settings.txt']).status, 0);
  repo.stage('notes.txt', 'Nothing secret here.\n');
  const clean = repo.git(['commit', '--quiet', '-m', 'add notes']);
  assert.equal(clean.status, 0, clean.output);
  assert.equal(repo.commits(), 1);
});

test('the pre-commit hook blocks the commit when gitleaks is not on PATH', t => {
  const repo = repository(t);
  assert.equal(repo.git(['config', 'core.hooksPath', hooks]).status, 0);
  const git = executable('git');
  assert(git, 'git must be on PATH');
  const bin = mkdtempSync(join(tmpdir(), 'ambrogio-cli-bin-'));
  t.after(() => rmSync(bin, { recursive: true, force: true }));
  symlinkSync(git, join(bin, 'git'));
  const environment = { ...repo.environment, PATH: bin };
  assert.equal(executable('gitleaks', bin), undefined);
  writeFileSync(join(repo.directory, 'notes.txt'), 'Nothing secret here.\n');
  assert.equal(repo.git(['add', 'notes.txt'], environment).status, 0);
  const blocked = repo.git(['commit', '--quiet', '-m', 'add notes'], environment);
  assert.notEqual(blocked.status, 0, 'the commit must fail without gitleaks');
  assert.equal(repo.commits(), 0);
  assert.match(blocked.output, /gitleaks not found on PATH; commit blocked\./);
  assert.match(blocked.output, /Install gitleaks 8\.30\.1 from https:\/\/github\.com\/gitleaks\/gitleaks\/releases/);
});

test('the CI scan command fails on a history with a secret without printing it and passes on a clean one', t => {
  requireGitleaks();
  const workflow = readFileSync(join(root, '.github/workflows/secret-scan.yml'), 'utf8');
  const command = /^ {8}run: (gitleaks git .+)$/m.exec(workflow)?.[1];
  assert.equal(command, 'gitleaks git --redact --no-banner --exit-code 1 .');

  const clean = repository(t);
  clean.stage('notes.txt', 'Nothing secret here.\n');
  assert.equal(clean.git(['commit', '--quiet', '-m', 'add notes']).status, 0);
  const passed = clean.run('sh', ['-c', command]);
  assert.equal(passed.status, 0, passed.output);

  const leaked = repository(t);
  const token = fakeToken();
  leaked.stage('notes.txt', 'Nothing secret here.\n');
  assert.equal(leaked.git(['commit', '--quiet', '-m', 'add notes']).status, 0);
  leaked.stage('settings.txt', `token = "${token}"\n`);
  assert.equal(leaked.git(['commit', '--quiet', '-m', 'add settings']).status, 0);
  leaked.stage('settings.txt', 'token = "<placeholder>"\n');
  assert.equal(leaked.git(['commit', '--quiet', '-m', 'remove the token']).status, 0);
  const failed = leaked.run('sh', ['-c', command]);
  assert.equal(failed.status, 1, failed.output);
  assert.match(failed.output, /leaks found: 1/);
  assert(!failed.output.includes(token), 'the scan output must not contain the secret');
});
