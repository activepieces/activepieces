import chalk from 'chalk';
import { Command } from 'commander';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import {
  generateActions,
  generateAuth,
  getJsonFromUrl,
  isUrl,
} from '../utils/scale';
import { createPiece } from './create-piece';

const convertOpenAPIToPiece = async (openAPISpec) => {
  const pieceName = openAPISpec.info.title.replace(/\s+/g, '-').toLowerCase();
  const packageName = `@activepieces/piece-${pieceName}`;
  const pieceType = 'community';
  const pieceNameCamelCase = pieceName
    .split('-')
    .map((s, i) => (i === 0 ? s : s[0].toUpperCase() + s.substring(1)))
    .join('');

  const pieceDir = path.join('packages', 'pieces', pieceType, pieceName, 'src');
  const actionsDir = path.join(pieceDir, 'lib', 'action');
  await createPiece(pieceName, packageName, pieceType);
  console.log(chalk.green(`Creating ${pieceName}... 🫸`));

  const authCode = await generateAuth(openAPISpec);
  const authDisplayName = authCode.split('\n')[1].trim().split(' ')[2];

  const actions = await generateActions(openAPISpec, authDisplayName);

  if (actions.length > 0 && !existsSync(actionsDir)) {
    mkdirSync(actionsDir, { recursive: true });
  }

  actions.forEach((action) => {
    writeFileSync(path.join(actionsDir, `${action.name}.ts`), action.code);
  });

  const actionImports = actions
    .map(
      (action) =>
        `import { ${action.name} } from './lib/action/${action.name}';`
    )
    .join('\n');
  const actionExports = actions.map((action) => `${action.name}`).join(', ');

  const pieceDefinition = `
    import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
    ${actionImports}

    ${authCode}

    export const ${pieceNameCamelCase} = createPiece({
      displayName: '${openAPISpec.info.title}',
      auth: ${authDisplayName},
      minimumSupportedRelease: '0.20.0',
      logoUrl: 'https://cdn.activepieces.com/pieces/${pieceName}.png',
      authors: [],
      actions: [${actionExports}],
      triggers: [],
    });
  `;

  writeFileSync(path.join(pieceDir, 'index.ts'), pieceDefinition);

  console.log(
    `🚨 Piece definition, auth, actions generated successfully in ${pieceDir}`
  );
};

const handleAPIConversion = async (pathOrUrl) => {
  let openAPISpec;

  if (isUrl(pathOrUrl)) {
    try {
      openAPISpec = await getJsonFromUrl(pathOrUrl);
      console.log('API spec downloaded successfully.');
    } catch (error) {
      console.error('Failed to download API spec:', error.message);
      return;
    }
  } else {
    try {
      openAPISpec = yaml.load(readFileSync(pathOrUrl, 'utf8'));
      console.log('API spec read from file successfully.');
    } catch (error) {
      console.error('Failed to read API spec from file:', error.message);
      return;
    }
  }

  try {
    await convertOpenAPIToPiece(openAPISpec);
    console.log('Piece converted successfully.');
  } catch (error) {
    console.error('Failed to convert piece:', error.message);
  }
};

export const scalePiecesCommand = new Command('scale')
  .description('Scale pieces in a certain way')
  .argument('<path>', 'Path to the OpenAPI spec file')
  .action(handleAPIConversion);
