import { Command } from "commander";
import { buildPiece, findPiece } from '../utils/piece-utils';
import chalk from "chalk";
import inquirer from "inquirer";

async function buildPieces(pieceName: string) {
    const pieceFolder = await findPiece(pieceName);
    const { outputFolder } = await buildPiece(pieceFolder);
    console.info(chalk.green(`Piece '${pieceName}' built and packed successfully at ${outputFolder}.`));
}

export const buildPieceCommand = new Command('build')
    .description('Build pieces without publishing')
    .argument('[name]', 'name of the piece to build')
    .action(async (name) => {
        const questions = [
            {
                type: 'input',
                name: 'name',
                message: 'Enter the piece folder name',
                placeholder: 'google-drive',
                when() {
                    return !name
                }
            },
        ];
        const answers = await inquirer.prompt(questions);
        await buildPieces(name ? name : answers.name);
    });
