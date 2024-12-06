import { Command } from "commander";
import { buildPiece, findAllPieces } from "../utils/piece-utils";
import chalk from "chalk";

async function buildPieces(pieceName: string) {
    const piecesFolder = await findAllPieces();
    if (piecesFolder.length === 0) {
        console.error(chalk.red(`Piece '${pieceName}' not found.`));
        process.exit(1);
    }
    const { outputFolder } = await buildPiece(piecesFolder[0]);
    console.info(chalk.green(`Piece '${pieceName}' built and packed successfully at ${outputFolder}.`));
}

export const buildPieceCommand = new Command('build')
    .description('Build pieces without publishing')
    .requiredOption('-n, --name <name>', 'Filter pieces by name')
    .action(async (options) => {
        await buildPieces(options.name);
    });
