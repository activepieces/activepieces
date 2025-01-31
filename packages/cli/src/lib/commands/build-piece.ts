import { Command } from "commander";
import { buildPiece, findPiece } from '../utils/piece-utils';
import chalk from "chalk";

async function buildPieces(pieceName: string) {
    const pieceFolder = await findPiece(pieceName);
    const { outputFolder } = await buildPiece(pieceFolder);
    console.info(chalk.green(`Piece '${pieceName}' built and packed successfully at ${outputFolder}.`));
}

export const buildPieceCommand = new Command('build')
    .description('Build pieces without publishing')
    .requiredOption('-n, --name <name>', 'Filter pieces by name')
    .action(async (options) => {
        await buildPieces(options.name);
    });
