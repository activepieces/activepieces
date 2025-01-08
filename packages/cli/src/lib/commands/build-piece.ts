import { Command } from "commander";
import { buildPiece, findPieceSourceDirectory } from "../utils/piece-utils";
import chalk from "chalk";

async function buildPieces(pieceName: string) {
    const piecesFolder = await findPieceSourceDirectory(pieceName);
    if (!piecesFolder) {
        console.error(chalk.red(`Piece '${pieceName}' not found.`));
        process.exit(1);
    }
    const { outputFolder } = await buildPiece(piecesFolder);
    console.info(chalk.green(`Piece '${pieceName}' built and packed successfully at ${outputFolder}.`));
}

export const buildPieceCommand = new Command('build')
    .description('Build pieces without publishing')
    .requiredOption('-n, --name <name>', 'Filter pieces by name')
    .action(async (options) => {
        await buildPieces(options.name);
    });
