import { writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import assert from 'node:assert';
import { argv } from 'node:process';
import chalk from 'chalk';

const validateInput = (pieceName: string, actionName: string) => {
  assert(
    pieceName && actionName,
    chalk.bgRed.white('Both pieceName and actionName are required')
  );
};

const toCamelCase = (str: string) => {
  return str
    .toLowerCase()
    .split('-')
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
};

const checkIfFileExists = async (filePath: string) => {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const generateActionFile = async (pieceName: string, actionName: string) => {
  const camelPieceName = toCamelCase(pieceName);
  const camelActionName = toCamelCase(actionName);
  const combinedName = `${camelPieceName}${
    camelActionName.charAt(0).toUpperCase() + camelActionName.slice(1)
  }Action`;
  const formattedPieceName = pieceName.replace(/-/g, '_');
  const formattedActionName = actionName.replace(/-/g, '_');
  const actionTemplateName = `${formattedPieceName}_${formattedActionName}`;

  const filePath = `packages/pieces/${pieceName}/src/lib/actions/${actionName}.ts`;
  const fileExists = await checkIfFileExists(filePath);
  assert(
    !fileExists,
    chalk.bgRed.white(
      `Action file ${actionName}.ts already exists for ${pieceName} piece`
    )
  );

  const actionTemplate = `
  import { createAction, Property } from '@activepieces/pieces-framework';

export const ${combinedName} = createAction({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: '${actionTemplateName}',
    displayName: 'ACTION DISPLAY NAME HERE',
    description: 'ACTION DESCRIPTION HERE',
    props: {},
    async run() {
      // Action logic here
    },
});
`;

  await writeFile(filePath, actionTemplate);
};

const checkIfPieceExists = async (pieceName: string) => {
  const dirPath = `packages/pieces/${pieceName}`;
  try {
    await access(dirPath, constants.F_OK);
  } catch {
    throw new Error(
      chalk.bgRed.white(`Piece "${pieceName}" doesn't exist,`) +
        ' ' +
        'For more info check https://www.activepieces.com/docs/developers/building-pieces/create-action#piece-definition'
    );
  }
};

const main = async () => {
  const [, , pieceName, actionName] = argv;

  validateInput(pieceName, actionName);
  await checkIfPieceExists(pieceName); // Check if the piece exists

  await generateActionFile(pieceName, actionName);

  console.log(`Action ${actionName} created for ${pieceName} piece`);
};

main();
