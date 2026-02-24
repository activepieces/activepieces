import * as fs from 'fs';
import * as path from 'path';

const PIECES_DIR = path.resolve(__dirname, '../../packages/pieces/community');

function getAllPieceDirs(): string[] {
  return fs.readdirSync(PIECES_DIR)
    .filter(d => {
      const srcIndex = path.join(PIECES_DIR, d, 'src', 'index.ts');
      return fs.existsSync(srcIndex) && fs.statSync(path.join(PIECES_DIR, d)).isDirectory();
    })
    .map(d => path.join(PIECES_DIR, d));
}

function findAuthExport(indexContent: string): { name: string; fullDefinition: string; startIndex: number; endIndex: number; imports: string[] } | null {
  // Match: export const fooAuth = PieceAuth.Something({...});
  const authPattern = /export\s+const\s+(\w+Auth)\s*=\s*PieceAuth\./;
  const match = authPattern.exec(indexContent);
  if (!match) return null;

  const authName = match[1];
  const defStart = match.index;

  // Find the balanced end of the PieceAuth call
  let depth = 0;
  let foundOpen = false;
  let endIdx = defStart;

  for (let i = match.index + match[0].length; i < indexContent.length; i++) {
    const ch = indexContent[i];
    if (ch === '(') {
      depth++;
      foundOpen = true;
    } else if (ch === ')') {
      depth--;
      if (foundOpen && depth === 0) {
        // Find the semicolon or newline after the closing paren
        let j = i + 1;
        while (j < indexContent.length && (indexContent[j] === ';' || indexContent[j] === '\n' || indexContent[j] === '\r')) {
          j++;
        }
        endIdx = j;
        break;
      }
    }
  }

  const fullDefinition = indexContent.substring(defStart, endIdx).trim();

  // Find what imports the auth definition needs
  // Look for imports used in the auth definition
  const imports: string[] = [];

  // Check if PieceAuth is needed
  if (fullDefinition.includes('PieceAuth.')) {
    imports.push('PieceAuth');
  }

  // Check if Property is needed
  if (fullDefinition.includes('Property.')) {
    imports.push('Property');
  }

  return { name: authName, fullDefinition, startIndex: defStart, endIndex: endIdx, imports };
}

function findFilesWithCircularImport(pieceDir: string, authName: string): { filePath: string; importPath: string }[] {
  const srcDir = path.join(pieceDir, 'src');
  const results: { filePath: string; importPath: string }[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.ts') && fullPath !== path.join(srcDir, 'index.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Match imports from index: from '../../index', from '../..', from '../../', etc.
        const importPattern = new RegExp(`from\\s+['"](\\.\\./)*\\.\\./?\\.?/?index?['"]`, 'g');
        const importPattern2 = new RegExp(`from\\s+['"](\\.\\./)+['"]`, 'g');

        if (importPattern.test(content) || importPattern2.test(content)) {
          // Check if it actually imports the auth name
          if (content.includes(authName)) {
            results.push({ filePath: fullPath, importPath: '' });
          }
        }
      }
    }
  }

  walk(srcDir);
  return results;
}

function getRelativeImportToAuth(filePath: string, pieceDir: string): string {
  const fileDir = path.dirname(filePath);
  const authFile = path.join(pieceDir, 'src', 'lib', 'auth');
  let rel = path.relative(fileDir, authFile).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function fixPiece(pieceDir: string): boolean {
  const pieceName = path.basename(pieceDir);
  const indexPath = path.join(pieceDir, 'src', 'index.ts');

  if (!fs.existsSync(indexPath)) return false;

  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  const authInfo = findAuthExport(indexContent);

  if (!authInfo) return false;

  // Check if there are files that import auth from index
  const circularFiles = findFilesWithCircularImport(pieceDir, authInfo.name);

  if (circularFiles.length === 0) return false;

  // Check if auth.ts already exists
  const authFilePath = path.join(pieceDir, 'src', 'lib', 'auth.ts');
  if (fs.existsSync(authFilePath)) return false;

  // Create lib/auth.ts
  const libDir = path.join(pieceDir, 'src', 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  // Build the auth file content
  const frameworkImports = authInfo.imports;
  let authFileContent = '';
  if (frameworkImports.length > 0) {
    authFileContent += `import { ${frameworkImports.join(', ')} } from '@activepieces/pieces-framework';\n`;
  }

  // Check if auth definition uses anything from @activepieces/shared
  const sharedImports: string[] = [];
  if (authInfo.fullDefinition.includes('PieceCategory')) sharedImports.push('PieceCategory');
  if (sharedImports.length > 0) {
    authFileContent += `import { ${sharedImports.join(', ')} } from '@activepieces/shared';\n`;
  }

  authFileContent += '\n';

  // Remove 'export ' from the definition for re-export pattern
  authFileContent += authInfo.fullDefinition + '\n';

  fs.writeFileSync(authFilePath, authFileContent);

  // Update index.ts: replace the auth definition with a re-export
  let newIndexContent = indexContent;

  // Remove the auth definition from index.ts
  const beforeAuth = newIndexContent.substring(0, authInfo.startIndex);
  const afterAuth = newIndexContent.substring(authInfo.endIndex);
  newIndexContent = beforeAuth + afterAuth;

  // Add the import and re-export at the top (after existing imports)
  // Find the last import statement
  const importLines = newIndexContent.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < importLines.length; i++) {
    if (importLines[i].trimStart().startsWith('import ') || importLines[i].trimStart().startsWith('import{')) {
      lastImportIdx = i;
    }
  }

  // Check if we already have an import for auth
  const hasAuthImport = newIndexContent.includes(`from './lib/auth'`);

  if (!hasAuthImport) {
    // Add import of auth and re-export
    const authImportLine = `import { ${authInfo.name} } from './lib/auth';`;
    const authReexportLine = `export { ${authInfo.name} } from './lib/auth';`;

    if (lastImportIdx >= 0) {
      importLines.splice(lastImportIdx + 1, 0, authImportLine);
      importLines.splice(lastImportIdx + 2, 0, authReexportLine);
    } else {
      importLines.unshift(authImportLine, authReexportLine);
    }
    newIndexContent = importLines.join('\n');
  }

  // Clean up: remove duplicate empty lines
  newIndexContent = newIndexContent.replace(/\n{3,}/g, '\n\n');

  // Also remove the PieceAuth import from index.ts if it's no longer used
  // (but only if PieceAuth isn't used elsewhere in index.ts)
  const remainingContent = newIndexContent.replace(/import.*PieceAuth.*from.*\n?/, (match) => {
    // Check if PieceAuth is still used in the remaining content (after removing the import line)
    const withoutImport = newIndexContent.replace(match, '');
    if (!withoutImport.includes('PieceAuth')) {
      // PieceAuth is no longer used - remove it from the import
      // But be careful - it might be part of a multi-import like { PieceAuth, createPiece }
      return match; // Keep it for now, don't break imports
    }
    return match;
  });

  fs.writeFileSync(indexPath, newIndexContent);

  // Update circular import files
  for (const { filePath } of circularFiles) {
    let fileContent = fs.readFileSync(filePath, 'utf-8');
    const relPath = getRelativeImportToAuth(filePath, pieceDir);

    // Replace import of auth from index with import from auth file
    // Match patterns like: import { fooAuth } from '../../index'
    // Or: import { fooAuth } from '../..'
    // Or: import { fooAuth, otherThing } from '../../index'
    const importRegex = new RegExp(
      `import\\s*\\{([^}]*)\\}\\s*from\\s*['"](\\.\\./)*\\.\\./?\\.?/?index?['"]`,
      'g'
    );
    const importRegex2 = new RegExp(
      `import\\s*\\{([^}]*)\\}\\s*from\\s*['"](\\.\\./)+['"]`,
      'g'
    );

    function replaceImport(content: string, regex: RegExp): string {
      return content.replace(regex, (match, importList) => {
        const imports = importList.split(',').map((s: string) => s.trim()).filter(Boolean);
        const authImports = imports.filter((i: string) => i === authInfo!.name);
        const otherImports = imports.filter((i: string) => i !== authInfo!.name);

        let result = '';
        if (authImports.length > 0) {
          result += `import { ${authImports.join(', ')} } from '${relPath}'`;
        }
        if (otherImports.length > 0) {
          // Keep the original import for non-auth imports
          if (result) result += ';\n';
          const originalFrom = match.match(/from\s*['"]([^'"]+)['"]/);
          if (originalFrom) {
            result += `import { ${otherImports.join(', ')} } from '${originalFrom[1]}'`;
          }
        }
        return result;
      });
    }

    fileContent = replaceImport(fileContent, importRegex);
    fileContent = replaceImport(fileContent, importRegex2);

    fs.writeFileSync(filePath, fileContent);
  }

  return true;
}

// Main
const pieceDirs = getAllPieceDirs();
let fixed = 0;
let skipped = 0;
const errors: string[] = [];

for (const pieceDir of pieceDirs) {
  try {
    const wasFixed = fixPiece(pieceDir);
    if (wasFixed) {
      fixed++;
      console.log(`Fixed: ${path.basename(pieceDir)}`);
    } else {
      skipped++;
    }
  } catch (e: unknown) {
    const err = e as Error;
    errors.push(`${path.basename(pieceDir)}: ${err.message}`);
  }
}

console.log(`\nDone: ${fixed} fixed, ${skipped} skipped, ${errors.length} errors`);
if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(e => console.log(`  ${e}`));
}
