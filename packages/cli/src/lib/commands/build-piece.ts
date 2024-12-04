import { Command } from "commander";
import { findAllPieces } from "../utils/piece-utils";
import { readProjectJson } from "../utils/files";
import path, { join } from "path";
import { exec } from "../utils/exec";
import chalk from "chalk";

async function buildPieces(pieceName: string) {
    const piecesFolder = await findAllPieces(join(process.cwd(), 'packages', 'pieces', 'custom', pieceName));

    if (piecesFolder.length === 0) {
        console.error(chalk.red(`Piece '${pieceName}' not found.`));
        process.exit(1);
    }

    const projectJson = await readProjectJson(piecesFolder[0]);

    await exec(`npx nx build ${projectJson.name} --skip-cache && cd ${path.resolve('dist/packages' + piecesFolder[0].split('/packages')[1])} && npm pack`);

    const compiledPath = path.resolve('dist/packages' + piecesFolder[0].split('/packages')[1]);
    console.info(chalk.green(`Piece '${projectJson.name}' built and packed successfully at ${compiledPath}.`));
}

export const buildPieceCommand = new Command('build')
    .description('Build pieces without publishing')
    .requiredOption('-n, --name <name>', 'Filter pieces by name')
    .action(async (options) => {
        await buildPieces(options.name);
    });
