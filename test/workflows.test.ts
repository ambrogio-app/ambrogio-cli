import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Verifications: Prova della protezione dei workflow di CI; Prova della configurazione del percorso CI;
// Prova della configurazione della scansione dei segreti in CI; Prova dell'audit delle dipendenze nella CI
// del client terminale; Prova del comando di verifica completo del client terminale.
// The workflows are read as text: the tests need no YAML parser and check the lines the contracts fix.
// Compiled to dist/test/, so the repository root is two levels up; the common contracts live in the
// ambrogio-model repository checked out side by side in the same workspace folder.
const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const workflows = { 'ci.yml': read('.github/workflows/ci.yml'), 'secret-scan.yml': read('.github/workflows/secret-scan.yml') };
const local = read('system-model/Contracts/TerminalConversation.md');
const common = read('../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md');

function contract(markdown: string, name: string): string {
  const text = markdown.split(`### ${name}\n`)[1]?.split('#### Metadata')[0];
  assert(text, `contract ${name} not found`);
  return text;
}

/** The lines of the block opened by `key:` at the given indentation, up to the next line at that level. */
function block(text: string, key: string, indent = 0): string {
  const lines = text.split('\n');
  const start = lines.findIndex(line => line === `${' '.repeat(indent)}${key}:`);
  assert(start >= 0, `${key} not found`);
  const end = lines.findIndex((line, index) => index > start && line.trim() !== ''
    && line.length - line.trimStart().length <= indent);
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n');
}

/** The direct children of a block, keyed by name. */
function children(text: string, indent: number): Record<string, string> {
  const names = [...text.matchAll(new RegExp(`^ {${indent}}([\\w-]+):`, 'gm'))].map(match => match[1]!);
  return Object.fromEntries(names.map(name => [name, block(text, name, indent)]));
}

function steps(job: string): string[] {
  return job.split(/^ {6}- /m).slice(1);
}

const commonProtection = contract(common, 'Profilo comune dei workflow GitHub Actions');
const protection = contract(local, 'Profilo di protezione dei workflow GitHub Actions');
const pins = Object.fromEntries([...commonProtection.matchAll(/`(actions\/[\w-]+)@([0-9a-f]{40})` \((v\d+)\)/g)]
  .map(match => [match[1]!, { commit: match[2]!, version: match[3]! }]));
const runsOn = /runner `([^`]+)`/.exec(commonProtection)?.[1];
const timeouts: Record<string, Record<string, string>> = {};
for (const match of protection.matchAll(/(\d+) per il job `([\w-]+)` di `([\w.-]+)`/g)) {
  (timeouts[match[3]!] ??= {})[match[2]!] = match[1]!;
}
const scanning = contract(common, 'Profilo di scansione dei segreti con gitleaks');
const gitleaksVersion = /archivio `gitleaks_(\d+\.\d+\.\d+)_linux_x64\.tar\.gz`/.exec(scanning)?.[1];
const gitleaksSha = /SHA-256 `([0-9a-f]{64})`/.exec(scanning)?.[1];

test('the contracts provide the values the workflow tests compare against', () => {
  assert.deepEqual(Object.keys(pins).sort(), ['actions/checkout', 'actions/setup-node']);
  assert.equal(runsOn, 'ubuntu-24.04');
  assert.deepEqual(timeouts, { 'ci.yml': { checks: '15' }, 'secret-scan.yml': { gitleaks: '10' } });
  assert.equal(gitleaksVersion, '8.30.1');
  assert.match(gitleaksSha ?? '', /^[0-9a-f]{64}$/);
});

for (const [file, text] of Object.entries(workflows)) {
  test(`${file} grants only read access to contents`, () => {
    assert.match(text, /^permissions:\n {2}contents: read\n(?! )/m);
    assert.equal([...text.matchAll(/permissions:/g)].length, 1, 'jobs declare no permissions');
    assert.doesNotMatch(text, /\bwrite\b|write-all|read-all/);
  });

  test(`${file} pins every action to the commit of the contract`, () => {
    const uses = [...text.matchAll(/^\s+(?:- )?uses: (.+)$/gm)].map(match => match[1]!);
    assert(uses.length > 0);
    for (const value of uses) {
      const match = /^([\w-]+\/[\w-]+)@([0-9a-f]{40}) # (v\d+)$/.exec(value);
      assert(match, `${value} is not pinned to a commit with its version comment`);
      assert.deepEqual({ commit: match[2], version: match[3] }, pins[match[1]!], `${match[1]} differs from the contract`);
    }
    if (file === 'ci.yml') assert(uses.some(value => value.startsWith('actions/setup-node@')));
  });

  test(`${file} limits every job and checks out without persisting credentials`, () => {
    const jobs = children(block(text, 'jobs'), 2);
    assert.deepEqual(Object.keys(jobs), Object.keys(timeouts[file] ?? {}));
    for (const [name, job] of Object.entries(jobs)) {
      assert.match(job, new RegExp(`^ {4}runs-on: ${runsOn}$`, 'm'), `${name} runs-on`);
      assert.match(job, new RegExp(`^ {4}timeout-minutes: ${timeouts[file]?.[name]}$`, 'm'), `${name} timeout`);
      for (const step of steps(job).filter(step => step.includes('uses: actions/checkout@'))) {
        assert.match(step, /^ {10}persist-credentials: false$/m, `${name} checkout keeps credentials`);
      }
      for (const step of steps(job).filter(step => step.includes('uses: actions/setup-node@'))) {
        assert.match(step, /^ {10}package-manager-cache: false$/m);
      }
    }
  });

  test(`${file} can be called by other workflows and declares no concurrency`, () => {
    assert.match(block(text, 'on'), /^ {2}workflow_call:$/m);
    assert.doesNotMatch(text, /^\s*concurrency:/m);
  });

  test(`${file} lets no failing step pass`, () => {
    assert.doesNotMatch(text, /continue-on-error|\|\| *true|set \+e/);
    for (const step of steps(text).filter(step => /run: \|/.test(step))) {
      assert.match(step, /shell: bash/);
      assert.match(step, /set -euo pipefail/);
    }
  });
}

/** The commands of the `run:` keys of the steps, in order. */
function runs(job: string): string[] {
  return steps(job).map(step => {
    const inline = /^ {8}run: (?!\|)(.+)$/m.exec(step)?.[1];
    if (inline) return inline;
    const lines = step.split('\n');
    const start = lines.indexOf('        run: |');
    if (start === -1) return '';
    const end = lines.findIndex((line, index) => index > start && line.trim() !== '' && !line.startsWith('         '));
    return lines.slice(start + 1, end === -1 ? undefined : end).map(line => line.trim()).join('\n');
  }).filter(Boolean);
}

function installGitleaks(job: string): string {
  const step = steps(job).find(step => step.startsWith('name: Install gitleaks\n'));
  assert(step, 'Install gitleaks step not found');
  return step;
}

test('ci.yml runs on the declared triggers', () => {
  const on = children(block(workflows['ci.yml'], 'on'), 2);
  assert.deepEqual(Object.keys(on), ['pull_request', 'push', 'workflow_dispatch', 'workflow_call']);
  assert.equal(on.push, '    branches: [main]');
});

test('ci.yml checks out the workspace side by side and checks the whole model', () => {
  const text = workflows['ci.yml'];
  assert.match(text, /^ {6}BRANCH: \$\{\{ github\.head_ref \|\| github\.ref_name \}\}$/m);
  const job = children(block(text, 'jobs'), 2).checks ?? '';
  const checkout = steps(job).find(step => step.includes('uses: actions/checkout@')) ?? '';
  assert.match(checkout, /^ {10}path: workspace\/ambrogio-cli$/m);
  assert.match(checkout, /^ {10}fetch-depth: 0$/m);
  const commands = runs(job);
  const clone = commands.findIndex(run => run.includes('git clone --quiet --branch "$ref" "$url" workspace/ambrogio-model'));
  assert(clone >= 0, 'ambrogio-model is cloned into workspace/ambrogio-model');
  const lines = commands[clone]!.split('\n');
  assert(lines.includes('url="https://github.com/ambrogio-app/ambrogio-model.git"'));
  assert(lines.includes('ref=main'));
  assert(lines.includes('if git ls-remote --exit-code --heads "$url" "$BRANCH" >/dev/null; then ref="$BRANCH"; fi'));
  const workspace = commands.indexOf('workspace/ambrogio-model/scripts/checkout-workspace workspace "$BRANCH"');
  const model = commands.indexOf('workspace/ambrogio-model/scripts/model-checks --workspace workspace');
  assert(clone < workspace && workspace < model, 'clone, checkout-workspace and model-checks run in this order');
  assert.doesNotMatch(text, /reqvire@|reqvire-version|check-model/, 'no step fixes a Reqvire version or runs the old checks');
});

test('ci.yml activates pnpm with Corepack, installs the frozen dependencies, audits them and gitleaks, then runs the checks in order', () => {
  const text = workflows['ci.yml'];
  const job = children(block(text, 'jobs'), 2).checks ?? '';
  assert.match(job, /^ {10}node-version: '24'$/m);
  assert.match(job, /^ {6}COREPACK_ENABLE_DOWNLOAD_PROMPT: '0'$/m, 'Corepack never waits for a download prompt');
  assert.doesNotMatch(text, /npm install --global|npm i -g|npx[^\n]*pnpm/, 'pnpm comes from Corepack only');
  const commands = runs(job);
  const position = (command: string, from = 0) => {
    const index = commands.findIndex((run, at) => at >= from && run.split('\n').includes(command));
    assert(index >= 0, `${command} is missing`);
    return index;
  };
  const backendInstall = position('pnpm install --frozen-lockfile');
  const order = [
    position('workspace/ambrogio-model/scripts/model-checks --workspace workspace'),
    position('corepack enable'),
    backendInstall,
    position('pnpm build'),
    position('pnpm install --frozen-lockfile', backendInstall + 1),
    position('pnpm audit --audit-level high'),
    position('pnpm typecheck'),
    position('pnpm test'),
    position('pnpm test:backend'),
    position('pnpm build', backendInstall + 1),
  ];
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'the checks run in the required order');
  assert.equal(order[5], order[4]! + 1, 'the audit runs right after the client installation');
  assert.match(steps(job).find(step => step.includes("git log -1 --format='ambrogio-backend %H'")) ?? '', /^ {8}working-directory: workspace\/ambrogio-backend$/m,
    'the backend is installed and built in its side-by-side checkout, with the pnpm version it declares');
  for (const command of ['pnpm install --frozen-lockfile', 'pnpm audit --audit-level high', 'pnpm typecheck', 'pnpm test',
    'pnpm test:backend', 'pnpm build']) {
    const step = steps(job).find(step => /^ {8}run: (.+)$/m.exec(step)?.[1] === command);
    assert.match(step ?? '', /^ {8}working-directory: workspace\/ambrogio-cli$/m, `${command} runs in the client`);
  }
  const install = commands.findIndex(run => run.includes('sha256sum --check --strict'));
  assert(install >= 0 && install < order[7]!, 'gitleaks is installed before the tests');
});

test('the dependency audit ignores no advisory except single GHSA identifiers recorded in pnpm-workspace.yaml', () => {
  for (const audit of Object.values(workflows).flatMap(text => text.match(/pnpm audit.*/g) ?? [])) {
    assert.equal(audit, 'pnpm audit --audit-level high');
  }
  const workspace = read('pnpm-workspace.yaml');
  const config = /^auditConfig:\n((?: {2,}.*\n?)*)/m.exec(workspace)?.[1];
  if (config !== undefined) {
    const lines = config.split('\n').filter(line => line.trim() !== '');
    assert.equal(lines[0], '  ignoreGhsas:', 'auditConfig only lists ignoreGhsas');
    for (const line of lines.slice(1)) assert.match(line, /^ {4}- GHSA(?:-[23456789cfghjmpqrvwx]{4}){3}$/);
  }
});

test('pnpm verify runs the model checks, the frozen installation, the audit, the backend preparation and the CI checks in order', () => {
  const manifest = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
  const job = children(block(workflows['ci.yml'], 'jobs'), 2).checks ?? '';
  const clientSteps = steps(job).filter(step => /^ {8}working-directory: workspace\/ambrogio-cli$/m.test(step));
  const ciCommands = clientSteps.map(step => /^ {8}run: (.+)$/m.exec(step)?.[1] ?? '')
    .filter(command => !['pnpm install --frozen-lockfile', 'pnpm audit --audit-level high'].includes(command));
  assert.deepEqual(ciCommands, ['pnpm typecheck', 'pnpm test', 'pnpm test:backend', 'pnpm build']);
  assert.equal(manifest.scripts?.verify, [
    '../ambrogio-model/scripts/model-checks',
    'pnpm install --frozen-lockfile',
    'pnpm audit --audit-level high',
    '(cd ../ambrogio-backend && pnpm install --frozen-lockfile && pnpm build)',
    ...ciCommands,
  ].join(' && '));
});

test('ci.yml installs gitleaks with the version, checksum and script of secret-scan.yml', () => {
  const ci = children(block(workflows['ci.yml'], 'jobs'), 2).checks ?? '';
  const scan = children(block(workflows['secret-scan.yml'], 'jobs'), 2).gitleaks ?? '';
  for (const job of [ci, scan]) {
    assert.match(job, new RegExp(`^ {6}GITLEAKS_VERSION: ${gitleaksVersion}$`, 'm'));
    assert.match(job, new RegExp(`^ {6}GITLEAKS_SHA256: ${gitleaksSha}$`, 'm'));
  }
  assert.equal(installGitleaks(ci), installGitleaks(scan));
});

test('secret-scan.yml scans the whole history with a verified gitleaks and redacted output', () => {
  const text = workflows['secret-scan.yml'];
  const on = children(block(text, 'on'), 2);
  assert.deepEqual(Object.keys(on), ['push', 'pull_request', 'workflow_dispatch', 'workflow_call']);
  assert.equal(on.push, "    branches: ['**']");
  const job = children(block(text, 'jobs'), 2).gitleaks ?? '';
  const checkout = steps(job).find(step => step.includes('uses: actions/checkout@'));
  assert.match(checkout ?? '', /^ {10}fetch-depth: 0$/m);
  const install = installGitleaks(job);
  const lines = install.split('\n').map(line => line.trim());
  const at = (pattern: RegExp) => {
    const index = lines.findIndex(line => pattern.test(line));
    assert(index >= 0, `${pattern} is missing`);
    return index;
  };
  const strict = at(/^set -euo pipefail$/);
  at(/^archive="gitleaks_\$\{GITLEAKS_VERSION\}_linux_x64\.tar\.gz"$/);
  const download = at(/^"https:\/\/github\.com\/gitleaks\/gitleaks\/releases\/download\/v\$\{GITLEAKS_VERSION\}\/\$\{archive\}"$/);
  const verify = at(/^echo "\$\{GITLEAKS_SHA256\}  \$RUNNER_TEMP\/\$archive" \| sha256sum --check --strict$/);
  const extract = at(/^tar -xzf /);
  const path = at(/^echo "\$RUNNER_TEMP" >> "\$GITHUB_PATH"$/);
  assert(strict < download && download < verify && verify < extract && extract < path,
    'the checksum is verified after the download and before the extraction');
  const scanStep = steps(job).at(-1) ?? '';
  assert.match(scanStep, /^ {8}run: gitleaks git --redact --no-banner --exit-code 1 \.$/m);
});
