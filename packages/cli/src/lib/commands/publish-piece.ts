import { Command } from "commander";
import { publishPieceFromFolder, findPieceSourceDirectory } from "../utils/piece-utils";
import chalk from "chalk";
import inquirer from 'inquirer';


async function publishPieces(apiUrl: string, apiKey: string, pieceName: string) {
    const piecesFolder = await findPieceSourceDirectory (pieceName);
    if (piecesFolder.length === 0) {
        console.error(chalk.red(`Piece '${pieceName}' not found.`));
        process.exit(1);
    }
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
                message: 'Enter the piece name',
                placeholder: 'google-drive',
            },
            {
                type: 'input',
                name: 'apiUrl',
                message: 'Enter the API URL',
                placeholder: 'https://cloud.activepieces.com/api',
            }
        ]

        const answers = await inquirer.prompt(questions);
        assertNullOrUndefinedOrEmpty(answers.name, 'Piece name is required');
        assertNullOrUndefinedOrEmpty(answers.apiUrl, 'API URL is required');
        
        const apiUrlWithoutTrailSlash = answers.apiUrl.replace(/\/$/, '');
        await publishPieces(apiUrlWithoutTrailSlash, answers.apiKey, answers.name);
    });