import { Command } from "commander";
import { findPieces, publishPieceFromFolder } from '../utils/piece-utils.js';
import chalk from "chalk";
import { join } from "path";

async function syncPieces(
  params:
  {apiUrl: string,
  apiKey: string,
  pieces: string[] | null,
  failOnError: boolean,}
) {
  const piecesDirectory = join(process.cwd(), 'packages', 'pieces', 'custom')
  const pieceFolders = await findPieces(piecesDirectory, params.pieces);
    for (const pieceFolder of pieceFolders) {
      await publishPieceFromFolder({
        pieceFolder,
       ...params
      });
    }
}

export const syncPieceCommand = new Command('sync')
    .description('Find new pieces versions and sync them with the database')
    .requiredOption('-h, --apiUrl <url>', 'API URL ex: https://cloud.activepieces.com/api')
    .option('-p, --pieces <pieces...>', 'Specify one or more piece names to sync. ' +
      'If not provided, all custom pieces in the directory will be synced.')
    .option('-f, --fail-on-error', 'Exit the process if an error occurs while syncing a piece', false)
    .action(async (options) => {
        const apiKey = process.env.AP_API_KEY;
        const pieces = options.pieces ? [...new Set<string>(options.pieces)] : null;
        const failOnError = options.failOnError;
        if (!apiKey) {
            console.error(chalk.red('AP_API_KEY environment variable is required'));
            process.exit(1);
        }
        await syncPieces({
          apiUrl: options.apiUrl.replace(/\/$/, ''),
          apiKey,
          pieces,
          failOnError
        });
    });
