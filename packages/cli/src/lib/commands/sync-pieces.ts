import { Command } from "commander";
import { findPieces, publishPieceFromFolder } from '../utils/piece-utils';
import chalk from "chalk";
import { join } from "path";

async function syncPieces(apiUrl: string, apiKey: string, pieces: string[] | null) {
  const piecesDirectory = join(process.cwd(), 'packages', 'pieces', 'custom')
  const pieceFolders = await findPieces(piecesDirectory, pieces);
    for (const pieceFolder of pieceFolders) {
      await publishPieceFromFolder(pieceFolder, apiUrl, apiKey);
    }
}

export const syncPieceCommand = new Command('sync')
    .description('Find new pieces versions and sync them with the database')
    .requiredOption('-h, --apiUrl <url>', 'API URL ex: https://cloud.activepieces.com/api')
    .option('-p, --pieces <pieces...>', 'Specify one or more piece names to sync. ' +
      'If not provided, all custom pieces in the directory will be synced.')
    .action(async (options) => {
        const apiKey = process.env.AP_API_KEY;
        const apiUrlWithoutTrailSlash = options.apiUrl.replace(/\/$/, '');
        const pieces = options.pieces ? [...new Set<string>(options.pieces)] : null;
        if (!apiKey) {
            console.error(chalk.red('AP_API_KEY environment variable is required'));
            process.exit(1);
        }
        await syncPieces(apiUrlWithoutTrailSlash, apiKey, pieces);
    });
