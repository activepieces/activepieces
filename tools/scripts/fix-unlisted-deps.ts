import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const rootPkgPath = path.join(ROOT, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));

// Snapshot ALL root deps before we modify anything
const allRootDeps: Record<string, string> = {
  ...rootPkg.dependencies,
  ...rootPkg.devDependencies,
};

// Build workspace name map
const workspaceNames = new Set<string>();
function loadWorkspaceNames() {
  for (const pattern of rootPkg.workspaces as string[]) {
    if (pattern.includes('*')) {
      const base = pattern.replace('/*', '');
      const fullBase = path.join(ROOT, base);
      if (fs.existsSync(fullBase)) {
        for (const entry of fs.readdirSync(fullBase)) {
          const pkgJson = path.join(fullBase, entry, 'package.json');
          if (fs.existsSync(pkgJson)) {
            const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));
            if (pkg.name) workspaceNames.add(pkg.name);
          }
        }
      }
    } else {
      const pkgJson = path.join(ROOT, pattern, 'package.json');
      if (fs.existsSync(pkgJson)) {
        const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));
        if (pkg.name) workspaceNames.add(pkg.name);
      }
    }
  }
}
loadWorkspaceNames();

// Node built-in modules to ignore
const nodeBuiltins = new Set([
  'fs', 'path', 'os', 'crypto', 'http', 'https', 'net', 'stream', 'url', 'util',
  'events', 'buffer', 'child_process', 'cluster', 'dgram', 'dns', 'domain',
  'module', 'querystring', 'readline', 'repl', 'string_decoder', 'timers',
  'tls', 'tty', 'v8', 'vm', 'zlib', 'assert', 'console', 'constants',
  'inspector', 'perf_hooks', 'process', 'punycode', 'worker_threads',
]);

function extractPackageName(specifier: string): string | null {
  if (specifier.startsWith('.') || specifier.startsWith('/')) return null;
  if (specifier.startsWith('node:')) return null;

  const parts = specifier.split('/');
  const pkgName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

  if (nodeBuiltins.has(pkgName)) return null;
  // Filter path aliases like @/components, @/features etc.
  if (pkgName.startsWith('@/')) return null;
  // Filter anything that looks like a path alias (single-letter scoped package)
  if (/^@[a-z]\//.test(pkgName)) return null;

  return pkgName;
}

function scanImportsInDir(dir: string): Set<string> {
  const deps = new Set<string>();
  if (!fs.existsSync(dir)) return deps;

  function walk(d: string) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        const content = fs.readFileSync(full, 'utf-8');
        // Use multiline-aware regex ([\s\S] matches newlines)
        const importRegex = /(?:import|export)\s+[\s\S]*?from\s+['"]([^'"]+)['"]/g;
        const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
        const dynamicImportRegex = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

        for (const regex of [importRegex, requireRegex, dynamicImportRegex]) {
          let match;
          while ((match = regex.exec(content)) !== null) {
            const pkg = extractPackageName(match[1]);
            if (pkg) deps.add(pkg);
          }
        }
      }
    }
  }
  walk(dir);
  return deps;
}

function scanConfigFiles(wsDir: string): Set<string> {
  const deps = new Set<string>();
  const configFiles = [
    'webpack.config.js', 'webpack.config.ts',
    'vite.config.ts', 'vite.config.js',
    'vitest.config.ts', 'vitest.config.js',
    'vitest.setup.ts',
    '.eslintrc.js', '.eslintrc.cjs', 'eslint.config.js', 'eslint.config.mjs',
    'postcss.config.js', 'postcss.config.cjs',
    'tailwind.config.js', 'tailwind.config.ts',
    'i18next-parser.config.js',
  ];

  for (const file of configFiles) {
    const full = path.join(wsDir, file);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf-8');
    const importRegex = /(?:import|export)\s+[\s\S]*?from\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;

    for (const regex of [importRegex, requireRegex]) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const pkg = extractPackageName(match[1]);
        if (pkg) deps.add(pkg);
      }
    }
  }
  return deps;
}

function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return sorted;
}

function resolveVersion(dep: string): string | null {
  // workspace packages
  if (workspaceNames.has(dep)) return 'workspace:*';
  return allRootDeps[dep] || null;
}

function processWorkspace(wsPath: string): { depsAdded: number; details: string } {
  const wsDir = path.join(ROOT, wsPath);
  const pkgPath = path.join(wsDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  if (!pkg.dependencies) pkg.dependencies = {};
  if (!pkg.devDependencies) pkg.devDependencies = {};

  const existingDeps = new Set([
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.devDependencies),
  ]);

  // Scan source files -> production deps
  const srcImports = scanImportsInDir(path.join(wsDir, 'src'));

  // Scan test files -> dev deps
  const testImports = new Set<string>();
  for (const testDir of ['test', 'tests', '__tests__', 'scenarios']) {
    for (const dep of scanImportsInDir(path.join(wsDir, testDir))) {
      testImports.add(dep);
    }
  }

  // Scan config files -> dev deps
  const configImports = scanConfigFiles(wsDir);

  let added = 0;
  const addedDeps: string[] = [];
  const addedDevDeps: string[] = [];

  // Add missing production deps
  for (const dep of srcImports) {
    if (existingDeps.has(dep)) continue;
    const version = resolveVersion(dep);
    if (!version) continue;
    pkg.dependencies[dep] = version;
    existingDeps.add(dep);
    added++;
    addedDeps.push(dep);
  }

  // Add missing dev deps (from tests + configs, excluding things already in deps)
  const allDevImports = new Set([...testImports, ...configImports]);
  for (const dep of allDevImports) {
    if (existingDeps.has(dep)) continue;
    if (srcImports.has(dep)) continue; // already added as prod dep
    const version = resolveVersion(dep);
    if (!version) continue;
    pkg.devDependencies[dep] = version;
    existingDeps.add(dep);
    added++;
    addedDevDeps.push(dep);
  }

  // Sort
  pkg.dependencies = sortObject(pkg.dependencies);
  if (Object.keys(pkg.devDependencies).length === 0) {
    delete pkg.devDependencies;
  } else {
    pkg.devDependencies = sortObject(pkg.devDependencies);
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  let details = '';
  if (addedDeps.length > 0) details += `    deps: ${addedDeps.join(', ')}\n`;
  if (addedDevDeps.length > 0) details += `    devDeps: ${addedDevDeps.join(', ')}\n`;

  return { depsAdded: added, details };
}

// ====== Step 1: Core workspaces ======
const coreWorkspaces = [
  'packages/shared',
  'packages/engine',
  'packages/react-ui',
  'packages/server/api',
  'packages/server/shared',
  'packages/server/worker',
  'packages/ee/shared',
  'packages/ee/ui/embed-sdk',
  'packages/cli',
  'packages/tests-e2e',
];

console.log('Step 1: Scanning core workspaces...\n');

for (const ws of coreWorkspaces) {
  const { depsAdded, details } = processWorkspace(ws);
  if (depsAdded > 0) {
    console.log(`  ${ws}: +${depsAdded}`);
    if (details) process.stdout.write(details);
  } else {
    console.log(`  ${ws}: ok`);
  }
}

// ====== Step 2: Pieces ======
console.log('\nStep 2: Scanning pieces...\n');

const piecesDir = path.join(ROOT, 'packages/pieces/community');
const pieces = fs.readdirSync(piecesDir).filter(entry => {
  const full = path.join(piecesDir, entry);
  return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'package.json'));
});

let totalPiecesUpdated = 0;
let totalPiecesDepsAdded = 0;

for (const piece of pieces) {
  const ws = `packages/pieces/community/${piece}`;
  const { depsAdded, details } = processWorkspace(ws);
  if (depsAdded > 0) {
    totalPiecesUpdated++;
    totalPiecesDepsAdded += depsAdded;
    console.log(`  ${piece}: +${depsAdded}`);
    if (details) process.stdout.write(details);
  }
}

console.log(`\n  Total pieces: ${totalPiecesUpdated} updated, ${totalPiecesDepsAdded} deps added`);

// ====== Step 3: Clean root package.json ======
console.log('\nStep 3: Cleaning root package.json...\n');

// Re-read root (hasn't been modified yet)
const freshRoot = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));

// Remove ALL production dependencies from root
const removedDepsCount = Object.keys(freshRoot.dependencies || {}).length;
delete freshRoot.dependencies;

// Keep only root-level dev tooling
const rootDevDepsToKeep = new Set([
  'turbo', 'concurrently', 'ts-node', 'tsx', 'tsconfig-paths', 'typescript',
  'husky', 'lint-staged', '@commitlint/cli', '@commitlint/config-conventional',
  'i18next-parser', '@playwright/test', 'chalk', 'inquirer', 'wait-on',
  'pino-pretty', 'knip',
]);

const newDevDeps: Record<string, string> = {};
const removedDevDeps: string[] = [];

for (const [dep, version] of Object.entries(freshRoot.devDependencies || {})) {
  if (rootDevDepsToKeep.has(dep)) {
    newDevDeps[dep] = version as string;
  } else {
    removedDevDeps.push(dep);
  }
}

freshRoot.devDependencies = sortObject(newDevDeps);
fs.writeFileSync(rootPkgPath, JSON.stringify(freshRoot, null, 2) + '\n');

console.log(`  Removed ${removedDepsCount} production deps`);
console.log(`  Removed ${removedDevDeps.length} dev deps`);
console.log(`  Kept ${Object.keys(newDevDeps).length} root dev deps: ${Object.keys(newDevDeps).join(', ')}`);
console.log('\n✓ Done! Run "bun install" to update the lockfile.');
