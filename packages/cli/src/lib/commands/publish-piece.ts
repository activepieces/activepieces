import { Command } from "commander";
import { publishPieceFromFolder, findPiece, assertPieceExists } from '../utils/piece-utils.js';
import chalk from "chalk";
import inquirer from 'inquirer';
import * as dotenv from 'dotenv';

dotenv.config({path: 'packages/server/api/.env'});

async function publishPiece(
    {apiUrl, apiKey, pieceName, failOnError}:
    {apiUrl: string,
    apiKey: string,
    pieceName: string,
    failOnError: boolean,}
) {
    const pieceFolder = await findPiece(pieceName);
    assertPieceExists(pieceFolder)
    await publishPieceFromFolder({
        pieceFolder,
        apiUrl,
        apiKey,
        failOnError
    });
}

function assertNullOrUndefinedOrEmpty(value: any, message: string) {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        console.error(chalk.red(message));
        process.exit(1);
    }
}

export const publishPieceCommand = new Command('publish')
    .description('Publish pieces to the platform')
    .option('-f, --fail-on-error', 'Exit the process if an error occurs while syncing a piece', false)
    .action(async (command) => {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter the piece folder name',
                default: 'google-drive',
            },
            {
                type: 'input',
                name: 'apiUrl',
                message: 'Enter the API URL',
                default: 'https://cloud.activepieces.com/api',
            },
            {
                type: 'list',
                name: 'apiKeySource',
                message: 'Select the API Key source',
                choices: ['Env Variable (AP_API_KEY)', 'Manually'],
                default: 'Env Variable (AP_API_KEY)'
            }
        ]);
        let apiKey: string | undefined;
        if (answers.apiKeySource === 'Manually') {
            const apiKeyAnswers = await inquirer.prompt([{
                type: 'input',
                name: 'apiKey',
                message: 'Enter the API Key',
            }]);
            apiKey = apiKeyAnswers.apiKey;
        } else {
            apiKey = process.env.AP_API_KEY;
        }
        assertNullOrUndefinedOrEmpty(answers.name, 'Piece name is required');
        assertNullOrUndefinedOrEmpty(answers.apiUrl, 'API URL is required');
        assertNullOrUndefinedOrEmpty(apiKey, 'API Key is required');
        const apiUrlWithoutTrailSlash = answers.apiUrl.replace(/\/$/, '');
        const { failOnError } = command;

        await publishPiece({
            apiUrl: apiUrlWithoutTrailSlash,
            apiKey,
            pieceName: answers.name,
            failOnError
        });
    });
