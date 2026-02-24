import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';

const PIECES_DIR = join(__dirname, '../../packages/pieces/community');

// Step 1: Remove `export { xxxAuth } from './lib/auth'` from all index.ts files
// Step 2: Change `import { xxxAuth } from '../..'` to `import { xxxAuth } from '../auth'` in all action/trigger/common files

function getAllFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      results.push(...getAllFiles(fullPath, pattern));
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// Step 1: Remove export { ...Auth } from './lib/auth' lines from index.ts files
const pieces = readdirSync(PIECES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let exportRemoved = 0;
for (const piece of pieces) {
  const indexPath = join(PIECES_DIR, piece, 'src/index.ts');
  if (!existsSync(indexPath)) continue;

  const content = readFileSync(indexPath, 'utf-8');
  // Match lines like: export { slackAuth } from './lib/auth';
  const newContent = content.replace(/^export \{ \w+ \} from '\.\/lib\/auth';?\n?/gm, '');

  if (newContent !== content) {
    writeFileSync(indexPath, newContent);
    exportRemoved++;
  }
}
console.log(`Removed export auth lines from ${exportRemoved} index.ts files`);

// Step 2: Change import { xxxAuth } from '../..' to import { xxxAuth } from '../auth'
// Also handle imports from '../../' and '../../index'
const allTsFiles = getAllFiles(join(PIECES_DIR), /\.ts$/);
let importFixed = 0;
for (const file of allTsFiles) {
  // Skip index.ts files at root of each piece
  if (file.endsWith('/src/index.ts')) continue;
  // Skip auth.ts files
  if (file.endsWith('/auth.ts')) continue;

  const content = readFileSync(file, 'utf-8');

  // Match import patterns that import auth from index:
  // import { xxxAuth } from '../..';
  // import { xxxAuth } from '../../';
  // import { xxxAuth } from '../../index';
  // Also handle cases where auth is one of multiple imports
  let newContent = content;

  // Pattern: import that contains Auth and comes from '../..' or '../../' or '../../index'
  // Simple case: only auth is imported
  newContent = newContent.replace(
    /import \{ (\w+Auth) \} from '\.\.\/\.\.(?:\/index)?';/g,
    "import { $1 } from '../auth';"
  );

  // Complex case: auth is imported along with other things from '../..'
  // e.g., import { someFunc, xxxAuth, otherFunc } from '../..';
  // We need to split this into two imports
  const complexPattern = /import \{([^}]*\b\w+Auth\b[^}]*)\} from '\.\.\/\.\.(?:\/index)?';/g;
  let match;
  // Reset lastIndex
  const tempContent = newContent;
  newContent = tempContent.replace(complexPattern, (fullMatch, importList) => {
    const imports = importList.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    const authImports = imports.filter((s: string) => /\w+Auth$/.test(s));
    const nonAuthImports = imports.filter((s: string) => !/\w+Auth$/.test(s));

    if (authImports.length === 0) return fullMatch;

    // If we already handled the simple case, skip
    if (nonAuthImports.length === 0) {
      return `import { ${authImports.join(', ')} } from '../auth';`;
    }

    // Split into two imports
    const authImportLine = `import { ${authImports.join(', ')} } from '../auth';`;
    const otherImportLine = `import { ${nonAuthImports.join(', ')} } from '../..';`;
    return `${authImportLine}\n${otherImportLine}`;
  });

  if (newContent !== content) {
    writeFileSync(file, newContent);
    importFixed++;
  }
}
console.log(`Fixed auth imports in ${importFixed} files`);
