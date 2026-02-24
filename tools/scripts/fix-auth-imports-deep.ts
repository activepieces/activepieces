import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';

const PIECES_DIR = join(__dirname, '../../packages/pieces/community');

function getAllFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
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

const pieces = readdirSync(PIECES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let fixed = 0;
for (const piece of pieces) {
  const authPath = join(PIECES_DIR, piece, 'src/lib/auth.ts');
  if (!existsSync(authPath)) continue; // No auth.ts, skip

  const srcDir = join(PIECES_DIR, piece, 'src');
  if (!existsSync(srcDir)) continue;

  // Search ALL .ts files under src/, not just src/lib/
  const files = getAllFiles(srcDir, /\.ts$/);
  for (const file of files) {
    if (file === authPath) continue; // Skip auth.ts itself
    if (file.endsWith('/index.ts') && dirname(file) === srcDir) continue; // Skip src/index.ts

    const content = readFileSync(file, 'utf-8');

    // Calculate the correct relative path from this file to auth.ts
    const fileDir = dirname(file);
    let relPath = relative(fileDir, authPath).replace(/\.ts$/, '');
    relPath = relPath.replace(/\\/g, '/');
    if (!relPath.startsWith('.')) {
      relPath = './' + relPath;
    }

    // Match any import of xxxAuth from a relative path (../ patterns or just ..)
    // that does NOT already point to auth
    // Patterns to match:
    //   import { xxxAuth } from '..';
    //   import { xxxAuth } from '../..';
    //   import { xxxAuth } from '../../..';
    //   import { xxxAuth } from '../../..'; (with optional /index)
    const authImportRegex = /import\s*\{\s*(\w+Auth)\s*\}\s*from\s*'(\.\.(?:\/\.\.)*)(?:\/index)?'\s*;/g;

    let newContent = content.replace(authImportRegex, (match, authName, dotPath) => {
      // Check if import already points to auth
      if (dotPath.endsWith('/auth') || dotPath === '../auth' || dotPath === './auth') {
        return match;
      }
      return `import { ${authName} } from '${relPath}';`;
    });

    if (newContent !== content) {
      writeFileSync(file, newContent);
      fixed++;
      console.log(`  Fixed: ${relative(PIECES_DIR, file)}`);
    }
  }
}
console.log(`\nFixed ${fixed} deep auth imports`);
