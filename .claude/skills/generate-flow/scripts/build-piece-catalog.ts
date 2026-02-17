/**
 * build-piece-catalog.ts
 *
 * Extracts a catalog of pieces, triggers, and actions from the activepieces codebase
 * and writes it to references/piece-catalog.md.
 *
 * Usage:
 *   npx tsx .claude/skills/generate-flow/scripts/build-piece-catalog.ts [--filter-by-library]
 *
 * Options:
 *   --filter-by-library   Only include pieces that appear in ../alan-automation/
 */

import * as fs from 'fs';
import * as path from 'path';

const PIECES_DIR = path.resolve(__dirname, '../../../../packages/pieces/community');
const ALAN_AUTOMATION_DIR = path.resolve(__dirname, '../../../../..', 'alan-automation');
const OUTPUT_FILE = path.resolve(__dirname, '../references/piece-catalog.md');

interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  displayName: string;
}

interface ActionOrTriggerInfo {
  name: string;
  displayName: string;
  description: string;
  props: PropInfo[];
}

interface PieceInfo {
  pieceName: string;
  displayName: string;
  description: string;
  authType: string;
  triggers: ActionOrTriggerInfo[];
  actions: ActionOrTriggerInfo[];
}

function getLibraryPieces(): Set<string> | null {
  if (!fs.existsSync(ALAN_AUTOMATION_DIR)) return null;

  const pieces = new Set<string>();
  const flowsPattern = /projects\/[^/]+\/flows\/[^/]+\.json$/;

  function walkDir(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && flowsPattern.test(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const matches = content.matchAll(/"pieceName":\s*"(@activepieces\/piece-[^"]+)"/g);
          for (const match of matches) {
            pieces.add(match[1]);
          }
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  try {
    walkDir(path.join(ALAN_AUTOMATION_DIR, 'projects'));
  } catch {
    return null;
  }

  return pieces;
}

function extractPropertyType(code: string): string {
  // Match Property.<Type>( patterns
  const match = code.match(/Property\.(\w+)\s*\(/);
  if (match) return match[1];
  // Match PieceAuth references
  if (code.includes('PieceAuth')) return 'Auth';
  return 'Unknown';
}

function parsePropsObject(propsCode: string): PropInfo[] {
  const props: PropInfo[] = [];

  // Match individual property definitions: propName: Property.Type({ ... })
  // or propName: someImportedProp (for shared props)
  const propPattern = /(\w+)\s*:\s*(Property\.(\w+)\s*\([\s\S]*?\)|[a-zA-Z]\w*(?:\([^)]*\))?)\s*(?:,|\})/g;

  // Simpler approach: find each prop key and its Property type
  const lines = propsCode.split('\n');
  let currentProp = '';
  let depth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match start of a property definition
    const propStart = trimmed.match(/^(\w+)\s*:\s*Property\.(\w+)\s*\(/);
    if (propStart && depth === 0) {
      const [, name, type] = propStart;
      const required = trimmed.includes('required: true');
      const displayNameMatch = trimmed.match(/displayName:\s*['"]([^'"]+)['"]/);
      props.push({
        name,
        type,
        required,
        displayName: displayNameMatch ? displayNameMatch[1] : name,
      });
      continue;
    }

    // Check for Property.* on same line with displayName on next lines
    const propStartSimple = trimmed.match(/^(\w+)\s*:\s*Property\.(\w+)\s*\(\s*\{?\s*$/);
    if (propStartSimple) {
      currentProp = propStartSimple[1];
      const propType = propStartSimple[2];
      // Read ahead for displayName and required
      props.push({
        name: currentProp,
        type: propType,
        required: false, // will try to update
        displayName: currentProp,
      });
      continue;
    }

    // Update last prop with displayName/required if found
    if (props.length > 0) {
      const lastProp = props[props.length - 1];
      const dn = trimmed.match(/displayName:\s*['"]([^'"]+)['"]/);
      if (dn && lastProp.displayName === lastProp.name) {
        lastProp.displayName = dn[1];
      }
      if (trimmed.includes('required: true')) {
        lastProp.required = true;
      }
    }
  }

  return props;
}

function extractActionsOrTriggers(
  indexContent: string,
  pieceDir: string,
  type: 'actions' | 'triggers'
): ActionOrTriggerInfo[] {
  const results: ActionOrTriggerInfo[] = [];
  const subDir = path.join(pieceDir, 'src', 'lib', type);

  if (!fs.existsSync(subDir)) return results;

  for (const file of fs.readdirSync(subDir)) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
    if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) continue;

    const filePath = path.join(subDir, file);
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const createFn = type === 'actions' ? 'createAction' : 'createTrigger';
    const createIdx = content.indexOf(createFn + '(');
    if (createIdx === -1) continue;

    // Extract name, displayName, description from within the createAction/createTrigger block
    const blockContent = content.substring(createIdx);
    const nameMatch = blockContent.match(/name:\s*['"]([^'"]+)['"]/);
    const displayNameMatch = blockContent.match(/displayName:\s*['"]([^'"]+)['"]/);
    const descMatch = blockContent.match(/description:\s*['"]([^'"]+)['"]/);

    if (!nameMatch) continue;

    // Extract props block
    const propsStart = content.indexOf('props:', createIdx);
    let propsInfo: PropInfo[] = [];
    if (propsStart !== -1) {
      // Find the opening brace
      const braceStart = content.indexOf('{', propsStart);
      if (braceStart !== -1) {
        let depth = 1;
        let i = braceStart + 1;
        while (i < content.length && depth > 0) {
          if (content[i] === '{') depth++;
          if (content[i] === '}') depth--;
          i++;
        }
        const propsCode = content.substring(braceStart, i);
        propsInfo = parsePropsObject(propsCode);
      }
    }

    results.push({
      name: nameMatch[1],
      displayName: displayNameMatch ? displayNameMatch[1] : nameMatch[1],
      description: descMatch ? descMatch[1] : '',
      props: propsInfo,
    });
  }

  return results;
}

function extractAuthType(content: string): string {
  if (content.includes('PieceAuth.OAuth2(')) return 'OAuth2';
  if (content.includes('PieceAuth.CustomAuth(')) return 'CustomAuth';
  if (content.includes('PieceAuth.SecretText(')) return 'SecretText';
  if (content.includes('PieceAuth.BasicAuth(')) return 'BasicAuth';
  if (content.includes('PieceAuth.None()')) return 'None';
  // Check for array of auth types
  if (content.match(/\[\s*\w+OAuth2\w*\s*,\s*\w+CustomAuth\w*\s*\]/)) return 'OAuth2 | CustomAuth';
  return 'Unknown';
}

function extractPieceInfo(pieceDir: string): PieceInfo | null {
  const indexPath = path.join(pieceDir, 'src', 'index.ts');
  if (!fs.existsSync(indexPath)) return null;

  let content: string;
  try {
    content = fs.readFileSync(indexPath, 'utf-8');
  } catch {
    return null;
  }

  // Must have createPiece
  const createPieceIdx = content.indexOf('createPiece(');
  if (createPieceIdx === -1) return null;

  const dirName = path.basename(pieceDir);
  const pieceName = `@activepieces/piece-${dirName}`;

  // Extract displayName and description from within the createPiece() call, not from auth definitions
  const createPieceBlock = content.substring(createPieceIdx);
  const displayNameMatch = createPieceBlock.match(/displayName:\s*['"]([^'"]+)['"]/);
  const descMatch = createPieceBlock.match(/description:\s*['"]([^'"]+)['"]/);
  const authType = extractAuthType(content);

  const triggers = extractActionsOrTriggers(content, pieceDir, 'triggers');
  const actions = extractActionsOrTriggers(content, pieceDir, 'actions');

  return {
    pieceName,
    displayName: displayNameMatch ? displayNameMatch[1] : dirName,
    description: descMatch ? descMatch[1] : '',
    authType,
    triggers,
    actions,
  };
}

function formatPropList(props: PropInfo[]): string {
  if (props.length === 0) return '  _(no props)_';
  return props
    .map(p => `  - \`${p.name}\` (${p.type}${p.required ? ', required' : ''}) — ${p.displayName}`)
    .join('\n');
}

function generateMarkdown(pieces: PieceInfo[]): string {
  let md = `# ActivePieces Piece Catalog

> Auto-generated by \`scripts/build-piece-catalog.ts\`
> Last updated: ${new Date().toISOString().split('T')[0]}

This catalog lists available pieces with their triggers, actions, and key input properties.
Use this to determine valid \`pieceName\`, \`triggerName\`/\`actionName\`, and \`input\` fields when generating flow JSON.

---

`;

  // Sort by displayName
  pieces.sort((a, b) => a.displayName.localeCompare(b.displayName));

  // Table of contents
  md += '## Table of Contents\n\n';
  for (const piece of pieces) {
    const anchor = piece.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    md += `- [${piece.displayName}](#${anchor}) — \`${piece.pieceName}\`\n`;
  }
  md += '\n---\n\n';

  for (const piece of pieces) {
    md += `## ${piece.displayName}\n\n`;
    md += `- **Package**: \`${piece.pieceName}\`\n`;
    md += `- **Auth**: ${piece.authType}\n`;
    if (piece.description) {
      md += `- **Description**: ${piece.description}\n`;
    }
    md += '\n';

    if (piece.triggers.length > 0) {
      md += '### Triggers\n\n';
      for (const trigger of piece.triggers) {
        md += `#### \`${trigger.name}\` — ${trigger.displayName}\n`;
        if (trigger.description) md += `${trigger.description}\n`;
        md += '\n**Props:**\n';
        md += formatPropList(trigger.props) + '\n\n';
      }
    }

    if (piece.actions.length > 0) {
      md += '### Actions\n\n';
      for (const action of piece.actions) {
        md += `#### \`${action.name}\` — ${action.displayName}\n`;
        if (action.description) md += `${action.description}\n`;
        md += '\n**Props:**\n';
        md += formatPropList(action.props) + '\n\n';
      }
    }

    md += '---\n\n';
  }

  return md;
}

async function main() {
  const filterByLibrary = process.argv.includes('--filter-by-library');

  console.log('Scanning pieces directory:', PIECES_DIR);

  let libraryPieces: Set<string> | null = null;
  if (filterByLibrary) {
    libraryPieces = getLibraryPieces();
    if (libraryPieces) {
      console.log(`Found ${libraryPieces.size} unique pieces in alan-automation library`);
    } else {
      console.warn('Could not read alan-automation library, proceeding without filter');
    }
  }

  const pieceDirs = fs.readdirSync(PIECES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(PIECES_DIR, d.name));

  console.log(`Found ${pieceDirs.length} piece directories`);

  const pieces: PieceInfo[] = [];

  for (const pieceDir of pieceDirs) {
    const info = extractPieceInfo(pieceDir);
    if (!info) continue;

    // Filter by library if requested
    if (libraryPieces && !libraryPieces.has(info.pieceName)) continue;

    // Skip pieces with no triggers and no actions (except for well-known utility pieces)
    if (info.triggers.length === 0 && info.actions.length === 0) continue;

    pieces.push(info);
  }

  console.log(`Extracted ${pieces.length} pieces`);

  const markdown = generateMarkdown(pieces);
  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');
  console.log(`Wrote catalog to ${OUTPUT_FILE}`);
}

main().catch(console.error);