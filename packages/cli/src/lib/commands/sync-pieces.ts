import { Command } from "commander";
import { findAllPieces, publishPieceFromFolder } from "../utils/piece-utils";
import chalk from "chalk";
import { join } from "path";


async function syncPieces(apiUrl: string, apiKey: string) {
    const piecesFolder = await findAllPieces(join(process.cwd(), 'packages', 'pieces', 'custom'));
    for (const pieceFolder of piecesFolder) {
        await publishPieceFromFolder(pieceFolder, apiUrl, apiKey);
    }
}

export const syncPieceCommand = new Command('sync')
    .description('Find new pieces versions and sync them with the database')
    .requiredOption('-h, --apiUrl <url>', 'API URL ex: https://cloud.activepieces.com/api')
    .action(async (options) => {
        const apiKey = process.env.AP_API_KEY;
        const apiUrlWithoutTrailSlash = options.apiUrl.replace(/\/$/, '');
        if (!apiKey) {
            console.error(chalk.red('AP_API_KEY environment variable is required'));
            process.exit(1);
        }
        await syncPieces(apiUrlWithoutTrailSlash, apiKey);
    });
