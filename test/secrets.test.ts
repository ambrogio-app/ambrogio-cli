import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { accessSync, chmodSync, constants, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Verifications: Prova dell'hook pre-commit dei segreti; Prova dei controlli del modello nell'hook
// pre-commit del client terminale; Prova della configurazione della scansione dei segreti in CI.
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

/**
 * An isolated Git repository in `<temporary>/repository`, ignoring the user's Git configuration. With `hook`,
 * the repository uses a copy of the client's pre-commit hook; `modelChecks` then places next to it a fake
 * `ambrogio-model/scripts/model-checks` that records its run in `<temporary>/model-checks.ran` and exits
 * with the given status, standing in for the real model checks.
 */
function repository(t: { after(fn: () => void): void }, options: { hook?: boolean; modelChecks?: 0 | 1 } = {}) {
  const base = mkdtempSync(join(tmpdir(), 'ambrogio-cli-secrets-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const directory = join(base, 'repository');
  mkdirSync(directory);
  const marker = join(base, 'model-checks.ran');
  if (options.modelChecks !== undefined) {
    const scripts = join(base, 'ambrogio-model', 'scripts');
    mkdirSync(scripts, { recursive: true });
    writeFileSync(join(scripts, 'model-checks'), `#!/bin/sh\ntouch '${marker}'\n`
      + (options.modelChecks === 0 ? 'exit 0\n' : "echo 'model-checks: fake violation' >&2\nexit 1\n"));
    chmodSync(join(scripts, 'model-checks'), 0o755);
  }
  const environment = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.com',
    GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.com' };
  const run = (command: string, args: readonly string[], env: NodeJS.ProcessEnv = environment) => {
    const result = spawnSync(command, args, { cwd: directory, env, encoding: 'utf8' });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  };
  const git = (args: readonly string[], env?: NodeJS.ProcessEnv) => run('git', args, env);
  assert.equal(git(['init', '--quiet']).status, 0);
  if (options.hook) {
    mkdirSync(join(directory, '.githooks'));
    copyFileSync(join(hooks, 'pre-commit'), join(directory, '.githooks', 'pre-commit'));
    chmodSync(join(directory, '.githooks', 'pre-commit'), 0o755);
    assert.equal(git(['config', 'core.hooksPath', '.githooks']).status, 0);
  }
  const commits = () => Number(git(['rev-list', '--count', '--all']).output.trim() || '0');
  const stage = (name: string, content: string) => {
    writeFileSync(join(directory, name), content);
    assert.equal(git(['add', name]).status, 0);
  };
  const modelChecksRan = () => existsSync(marker);
  return { directory, environment, run, git, commits, stage, modelChecksRan };
}

function requireGitleaks(): void {
  assert(executable('gitleaks'), 'gitleaks 8.30.1 must be on PATH to run this test (CI installs it in the checks job)');
}

test('the pre-commit hook blocks a staged secret without printing it or running the model checks', t => {
  requireGitleaks();
  const repo = repository(t, { hook: true, modelChecks: 0 });
  const token = fakeToken();
  repo.stage('settings.txt', `token = "${token}"\n`);
  const blocked = repo.git(['commit', '--quiet', '-m', 'add settings']);
  assert.notEqual(blocked.status, 0, 'the commit with a secret must fail');
  assert.equal(repo.commits(), 0, 'no commit is created');
  assert.match(blocked.output, /leaks found: 1/);
  assert(!blocked.output.includes(token), 'the hook output must not contain the secret');
  assert.equal(repo.modelChecksRan(), false, 'the model checks run only after a clean secret scan');
});

test('the pre-commit hook lets a clean commit through after the model checks of the side-by-side ambrogio-model', t => {
  requireGitleaks();
  const repo = repository(t, { hook: true, modelChecks: 0 });
  repo.stage('notes.txt', 'Nothing secret here.\n');
  const clean = repo.git(['commit', '--quiet', '-m', 'add notes']);
  assert.equal(clean.status, 0, clean.output);
  assert.equal(repo.commits(), 1);
  assert.equal(repo.modelChecksRan(), true, 'the hook runs ambrogio-model/scripts/model-checks');
});

test('the pre-commit hook blocks the commit when the model checks fail', t => {
  requireGitleaks();
  const repo = repository(t, { hook: true, modelChecks: 1 });
  repo.stage('notes.txt', 'Nothing secret here.\n');
  const blocked = repo.git(['commit', '--quiet', '-m', 'add notes']);
  assert.notEqual(blocked.status, 0, 'a failing model check must block the commit');
  assert.equal(repo.commits(), 0);
  assert.equal(repo.modelChecksRan(), true);
  assert.match(blocked.output, /model-checks: fake violation/);
});

test('the pre-commit hook blocks the commit when ambrogio-model is not next to the repository', t => {
  requireGitleaks();
  const repo = repository(t, { hook: true });
  repo.stage('notes.txt', 'Nothing secret here.\n');
  const blocked = repo.git(['commit', '--quiet', '-m', 'add notes']);
  assert.notEqual(blocked.status, 0, 'the commit must fail without ambrogio-model');
  assert.equal(repo.commits(), 0);
  assert(blocked.output.includes('pre-commit: ambrogio-model is not next to this repository; '
    + 'clone https://github.com/ambrogio-app/ambrogio-model beside it and retry.'), blocked.output);
});

test('the pre-commit hook blocks the commit when gitleaks is not on PATH', t => {
  const repo = repository(t, { hook: true, modelChecks: 0 });
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
  assert.equal(repo.modelChecksRan(), false);
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
