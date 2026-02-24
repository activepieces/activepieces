import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const PIECES_DIR = join(__dirname, '../../packages/pieces/community');

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

// For each piece, check if src/lib/auth.ts exists
// If it does NOT exist, revert any import { xxxAuth } from '../auth' back to '../..'
const pieces = readdirSync(PIECES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let reverted = 0;
for (const piece of pieces) {
  const authPath = join(PIECES_DIR, piece, 'src/lib/auth.ts');
  if (existsSync(authPath)) continue; // Has auth.ts, skip

  // Find all .ts files under src/lib/
  const libDir = join(PIECES_DIR, piece, 'src/lib');
  if (!existsSync(libDir)) continue;

  const files = getAllFiles(libDir, /\.ts$/);
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    // Revert import { xxxAuth } from '../auth' back to '../..'
    const newContent = content.replace(
      /import \{ (\w+Auth) \} from '\.\.\/auth';/g,
      "import { $1 } from '../..';"
    );
    if (newContent !== content) {
      writeFileSync(file, newContent);
      reverted++;
    }
  }
}
console.log(`Reverted ${reverted} files in pieces without auth.ts`);
