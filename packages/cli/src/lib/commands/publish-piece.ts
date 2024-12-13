import { Command } from "commander";
import { publishPieceFromFolder, findPieceSourceDirectory } from "../utils/piece-utils";
import chalk from "chalk";


async function publishPieces(apiUrl: string, apiKey: string, pieceName: string) {
    const piecesFolder = await findPieceSourceDirectory (pieceName);
    if (piecesFolder.length === 0) {
        console.error(chalk.red(`Piece '${pieceName}' not found.`));
        process.exit(1);
    }
    await publishPieceFromFolder(piecesFolder, apiUrl, apiKey);
}

export const publishPieceCommand = new Command('publish')
    .description('Publish pieces to the platform')
    .requiredOption('-h, --apiUrl <url>', 'API URL ex: https://cloud.activepieces.com/api')
    .requiredOption('-n, --name <name>', 'Filter pieces by name')
    .action(async (options) => {
        const apiKey = process.env.AP_API_KEY;
        const apiUrlWithoutTrailSlash = options.apiUrl.replace(/\/$/, '');
        if (!apiKey) {
            console.error(chalk.red('AP_API_KEY environment variable is required'));
            process.exit(1);
        }
        await publishPieces(apiUrlWithoutTrailSlash, apiKey, options.name);
    });
