import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Verification: Prova dell'assenza di import del backend nel client terminale.
// The production sources are read as text. Compiled to dist/test/, so the repository root is two levels up.
const root = fileURLToPath(new URL('../../', import.meta.url));

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(?:[cm]?[jt]s|tsx|jsx)$/.test(entry.name) ? [path] : [];
  });
}

/** The specifiers of the static imports, the re-exports and the dynamic imports of a source text, in order. */
export function specifiers(text: string): string[] {
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[\w*{}\s,$]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /\brequire\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  ];
  return patterns.flatMap(pattern => [...text.matchAll(pattern)])
    .sort((a, b) => a.index - b.index).map(match => match[1]!);
}

/** Why a specifier of the file points at backend code, or undefined when it does not. */
export function backendReference(file: string, specifier: string): string | undefined {
  if (/ambrogio-backend/.test(specifier)) return 'names the ambrogio-backend repository';
  if (/^@ambrogio\//.test(specifier)) return 'names a package of the backend';
  if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('file:')) {
    const target = specifier.startsWith('file:') ? fileURLToPath(specifier) : resolve(file, '..', specifier);
    if (relative(root, target).split(sep)[0] === '..') return 'leaves the root of the client';
  }
  return undefined;
}

test('the detector recognises every form of import that reaches the backend', () => {
  const file = join(root, 'src', 'example.ts');
  const sample = [
    "import { startTestServer } from '../../ambrogio-backend/apps/server/dist/runtime/test-server.js';",
    "import type { Turn } from '@ambrogio/conversations/domain/turn';",
    "export * from '../../server.js';",
    "const module = await import('../../elsewhere/index.js');",
    "import './side-effect.js';",
    "import { texts } from './i18n.js';",
    "import WebSocket from 'ws';",
  ].join('\n');
  const found = specifiers(sample);
  assert.equal(found.length, 7);
  assert.deepEqual(found.map(specifier => backendReference(file, specifier) !== undefined),
    [true, true, true, true, false, false, false]);
});

test('no production source of the client imports backend code', () => {
  const files = sources(join(root, 'src'));
  assert(files.length > 0, 'src/ contains the production sources');
  const offending = files.flatMap(file => specifiers(readFileSync(file, 'utf8')).flatMap(specifier => {
    const reason = backendReference(file, specifier);
    return reason ? [`${relative(root, file)}: ${specifier} (${reason})`] : [];
  }));
  assert.deepEqual(offending, []);
  // The production code imports only Node.js built-ins, its runtime dependencies and its own modules.
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> };
  const allowed = new Set(Object.keys(manifest.dependencies ?? {}));
  for (const file of files) {
    for (const specifier of specifiers(readFileSync(file, 'utf8'))) {
      if (specifier.startsWith('.') || specifier.startsWith('node:')) continue;
      const name = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]!;
      assert(allowed.has(name), `${relative(root, file)} imports ${specifier}, which is not a runtime dependency`);
    }
  }
});
