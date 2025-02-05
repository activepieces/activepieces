import { Command } from "commander";
import { publishPieceFromFolder, findPiece, assertPieceExists } from '../utils/piece-utils';
import chalk from "chalk";
import inquirer from 'inquirer';
import * as dotenv from 'dotenv';

dotenv.config({path: 'packages/server/api/.env'});

async function publishPieces(apiUrl: string, apiKey: string, pieceName: string) {
    const piecesFolder = await findPiece(pieceName);
    assertPieceExists(piecesFolder)
    await publishPieceFromFolder(piecesFolder, apiUrl, apiKey);
}

function assertNullOrUndefinedOrEmpty(value: any, message: string) {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        console.error(chalk.red(message));
        process.exit(1);
    }
}

export const publishPieceCommand = new Command('publish')
    .description('Publish pieces to the platform')
    .action(async () => {
        const questions = [
            {
                type: 'input',
                name: 'name',
                message: 'Enter the piece folder name',
                placeholder: 'google-drive',
            },
            {
                type: 'input',
                name: 'apiUrl',
                message: 'Enter the API URL',
                placeholder: 'https://cloud.activepieces.com/api',
            },
            {
                type: 'list',
                name: 'apiKeySource',
                message: 'Select the API Key source',
                choices: ['Env Variable (AP_API_KEY)', 'Manually'],
                default: 'Env Variable (AP_API_KEY)'
            }
        ]

        const answers = await inquirer.prompt(questions);
        if (answers.apiKeySource === 'Manually') {
            const apiKeyAnswers = await inquirer.prompt([{
                type: 'input',
                name: 'apiKey',
                message: 'Enter the API Key',
            }]);
            answers.apiKey = apiKeyAnswers.apiKey;
        }
        const apiKey = answers.apiKeySource === 'Env Variable (AP_API_KEY)' ? process.env.AP_API_KEY : answers.apiKey;
        assertNullOrUndefinedOrEmpty(answers.name, 'Piece name is required');
        assertNullOrUndefinedOrEmpty(answers.apiUrl, 'API URL is required');
        assertNullOrUndefinedOrEmpty(apiKey, 'API Key is required');

        const apiUrlWithoutTrailSlash = answers.apiUrl.replace(/\/$/, '');

        await publishPieces(apiUrlWithoutTrailSlash, apiKey, answers.name);
    });
