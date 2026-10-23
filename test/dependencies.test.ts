import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

// Compiled to dist/test/, so the repository root is two levels up.
const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

interface Manifest {
  packageManager?: string;
  engines?: { node?: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const manifest = JSON.parse(read('package.json')) as Manifest;
const direct = { ...manifest.dependencies, ...manifest.devDependencies };

// The project lockfile is the last YAML document; the first one records pnpm itself.
const projectLock = read('pnpm-lock.yaml').split(/^---$/m).at(-1) ?? '';
const rootImporter = projectLock.split(/^importers:$/m)[1]?.split(/^packages:$/m)[0] ?? '';

function locked(name: string): { specifier?: string; version?: string } {
  const key = name.startsWith('@') ? `'${name}'` : name;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^ {6}${escaped}:\\n {8}specifier: (\\S+)\\n {8}version: (\\S+)$`, 'm').exec(rootImporter);
  return { specifier: match?.[1], version: match?.[2] };
}

test('pnpm 12.11.2 is the declared package manager and Node.js 24 the minimum', () => {
  assert.equal(manifest.packageManager, 'pnpm@12.11.2');
  assert.equal(manifest.engines?.node, '>=24');
  assert.equal(existsSync(new URL('package-lock.json', root)), false);
});

test('direct dependencies use the exact versions resolved in the lockfile', () => {
  assert.ok(Object.keys(direct).length > 0);
  for (const [name, version] of Object.entries(direct)) {
    assert.match(version, /^\d+\.\d+\.\d+$/, `${name} uses a version range`);
    assert.deepEqual(locked(name), { specifier: version, version }, `${name} differs from pnpm-lock.yaml`);
  }
});

test('pnpm allows no dependency build scripts and keeps the minimum release age', () => {
  const workspace = read('pnpm-workspace.yaml');
  assert.match(workspace, /^allowBuilds: \{\}$/m);
  assert.doesNotMatch(workspace, /minimumReleaseAge/);
});
