import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = [];
afterEach(() => { for (const folder of temporary.splice(0)) rmSync(folder, { recursive: true, force: true }); });
function generate(ids) {
  const folder = mkdtempSync(join(tmpdir(), 'famulor-catalog-test-'));
  temporary.push(folder);
  const spec = join(folder, 'openapi.json');
  writeFileSync(spec, JSON.stringify({ paths: Object.fromEntries(ids.map((id, i) => [`/resource-${i}`, { get: { operationId: id, responses: {} } }])) }));
  return spawnSync(process.execPath, [join(root, 'scripts/generate-catalog.mjs'), spec], { encoding: 'utf8' });
}

describe('generator input boundary', () => {
  it.each(['../outside', "name'; throw Error('injected')", 'delete', 'get-value', '$invalid', '1invalid', 'get/value', 'get\\value'])('rejects unsafe or reserved operation ID %s before any write', (id) => {
    const catalog = readFileSync(join(root, 'src/lib/generated/catalog.ts'), 'utf8');
    const registry = readFileSync(join(root, 'src/lib/generated/native-actions.ts'), 'utf8');
    const result = generate([id]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Invalid operationId|reserved JavaScript/);
    expect(readFileSync(join(root, 'src/lib/generated/catalog.ts'), 'utf8')).toBe(catalog);
    expect(readFileSync(join(root, 'src/lib/generated/native-actions.ts'), 'utf8')).toBe(registry);
  });
  it.each([['getSMS', 'getSms'], ['getMe', 'getCurrentUser']])('rejects filename or alias collisions: %s, %s', (a, b) => {
    const result = generate([a, b]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('duplicate native action names or filenames');
  });
});
