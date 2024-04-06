import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { checkIfFileExists, makeFolderRecursive } from '../utils/files';
import { displayNameToCamelCase, displayNameToKebabCase, findPieceSourceDirectory } from '../utils/piece-utils';

function createTriggerTemplate(displayName: string, description: string, technique: string) {
    const camelCase = displayNameToCamelCase(displayName)
    let triggerTemplate = ''
    if (technique === 'polling') {
        triggerTemplate = `
import { createTrigger, TriggerStrategy, PiecePropValueSchema  } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

// replace auth with piece auth variable
const polling: Polling< PiecePropValueSchema<typeof auth>, Record<string, never> > = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS }) => {
        // implement the logic to fetch the items
        const items = [ {id: 1, created_date: '2021-01-01T00:00:00Z'}, {id: 2, created_date: '2021-01-01T00:00:00Z'}];
        return items.map((item) => ({
            epochMilliSeconds: dayjs(item.created_date).valueOf(),
            data: item,
            }));
        }
}

export const ${camelCase} = createTrigger({
// auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
name: '${camelCase}',
displayName: '${displayName}',
description: '${description}',
props: {},
sampleData: {},
type: TriggerStrategy.POLLING,
async test(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue });
},
async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
},

async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
},

async run(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue });
},
});`;
    }
    else {
        triggerTemplate = `
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const ${camelCase} = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: '${camelCase}',
    displayName: '${displayName}',
    description: '${description}',
    props: {},
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        // implement webhook creation logic
    },
    async onDisable(context){
        // implement webhook deletion logic
    },
    async run(context){
        return [context.payload.body]
    }
})`;

    }

    return triggerTemplate
}
const checkIfPieceExists = async (pieceName: string) => {
    const path = await findPieceSourceDirectory(pieceName);
    if (!path) {
        console.log(chalk.red(`🚨 Piece ${pieceName} not found`));
        process.exit(1);
    }
};

const checkIfTriggerExists = async (triggerPath: string) => {
    if (await checkIfFileExists(triggerPath)) {
        console.log(chalk.red(`🚨 Trigger already exists at ${triggerPath}`));
        process.exit(1);
    }
}
const createTrigger = async (pieceName: string, displayTriggerName: string, triggerDescription: string, triggerTechnique: string) => {
    const triggerTemplate = createTriggerTemplate(displayTriggerName, triggerDescription, triggerTechnique)
    const triggerName = displayNameToKebabCase(displayTriggerName)
    const path = await findPieceSourceDirectory(pieceName);
    await checkIfPieceExists(pieceName);
    console.log(chalk.blue(`Piece path: ${path}`))

    const triggersFolder = join(path, 'src', 'lib', 'triggers')
    const triggerPath = join(triggersFolder, `${triggerName}.ts`)
    await checkIfTriggerExists(triggerPath)

    await makeFolderRecursive(triggersFolder);
    await writeFile(triggerPath, triggerTemplate);
    console.log(chalk.yellow('✨'), `Trigger ${triggerPath} created`);
};


export const createTriggerCommand = new Command('create')
    .description('Create a new trigger')
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
                name: 'triggerName',
                message: 'Enter the trigger display name:',
            },
            {
                type: 'input',
                name: 'triggerDescription',
                message: 'Enter the trigger description:',
            },
            {
                type: 'list',
                name: 'triggerTechnique',
                message: 'Select the trigger technique:',
                choices: ['polling', 'webhook'],
                default: 'webhook',
            },
        ];

        const answers = await inquirer.prompt(questions);
        createTrigger(answers.pieceName, answers.triggerName, answers.triggerDescription, answers.triggerTechnique);
    });
