import { writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { displayNameToCamelCase, findPieceSourceDirectory, displayNameToKebabCase } from '../utils/piece-utils';
import { checkIfFileExists, makeFolderRecursive } from '../utils/files';
import { join } from 'node:path';
import { GeneratedAction, generateAction } from '../utils/generate-action';

function createActionTemplate({ displayName, description, generatedAction }: CreateActionTemplateParams) {
  const camelCase = displayNameToCamelCase(displayName)
  const actionTemplate = `import { createAction, Property } from '@activepieces/pieces-framework';

export const ${camelCase} = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: '${camelCase}',
  displayName: '${displayName}',
  description: '${description}',
  props: ${generatedAction.props},
  ${generatedAction.run},
});
`;

  return actionTemplate
}
const checkIfPieceExists = async (pieceName: string) => {
  const path = await findPieceSourceDirectory(pieceName);
  if (!path) {
    console.log(chalk.red(`🚨 Piece ${pieceName} not found`));
    process.exit(1);
  }
};

const checkIfActionExists = async (actionPath: string) => {
  if (await checkIfFileExists(actionPath)) {
    console.log(chalk.red(`🚨 Action already exists at ${actionPath}`));
    process.exit(1);
  }
}

const createAction = async ({ pieceName, actionDisplayName, actionDescription, apiEndpoint }: CreateActionParams) => {
  const generatedAction = await generateAction(apiEndpoint)

  const actionTemplate = createActionTemplate({
    displayName: actionDisplayName,
    description: actionDescription,
    generatedAction
  })

  const actionName = displayNameToKebabCase(actionDisplayName)
  const path = await findPieceSourceDirectory(pieceName);
  await checkIfPieceExists(pieceName);
  console.log(chalk.blue(`Piece path: ${path}`))

  const actionsFolder = join(path, 'src', 'lib', 'actions')
  const actionPath = join(actionsFolder, `${actionName}.ts`)
  await checkIfActionExists(actionPath)

  await makeFolderRecursive(actionsFolder);
  await writeFile(actionPath, actionTemplate);
  execSync(`nx format --files ${actionPath}`)
  console.log(chalk.yellow('✨'), `Action ${actionPath} created`);
};


export const createActionCommand = new Command('create')
  .description('Create a new action')
  .action(async () => {
    const questions = [
      {
        type: 'input',
        name: 'pieceName',
        message: 'Enter the piece folder name:',
        placeholder: 'google-drive',
      },
      {
        type: 'input',
        name: 'actionDisplayName',
        message: 'Enter the action display name',
      },
      {
        type: 'input',
        name: 'actionDescription',
        message: 'Enter the action description',
      },
      {
        type: 'input',
        name: 'apiEndpoint',
        message: 'Enter the name of the API endpoint to generate starter code. e.g. Slack API post message endpoint',
      }
    ];

    const answers = await inquirer.prompt(questions)
    createAction(answers)
  });

type CreateActionParams = {
  pieceName: string;
  actionDisplayName: string;
  actionDescription: string;
  apiEndpoint: string;
}

type CreateActionTemplateParams = {
  displayName: string
  description: string
  generatedAction: GeneratedAction
}
