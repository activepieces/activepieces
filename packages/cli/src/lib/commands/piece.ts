import chalk from "chalk";
import { logger } from "../logger";
import { authCommands } from "./auth";
import Table from 'cli-table3';
import prompts from 'prompts';
import fs from 'fs';
import { execSync } from "child_process";
import FormData from 'form-data';

export const pieceCommands = {
    async list() {
        const config = await authCommands.getToken();
        logger.info(chalk.blue("Fetching pieces..."));
        const response = await fetch(`${config.apiUrl}/v1/pieces`, {
            headers: {
                'Authorization': `Bearer ${config.token}`
            },
        });
        const result = await response.json();
        const simplifiedResult = result.filter((f) => !!f.projectId).map((piece) => ({
            name: piece.name,
            displayName: piece.displayName,
            version: piece.version
        }));
        if (simplifiedResult.length === 0) {
            logger.info(chalk.yellow("No pieces found."));
        } else {
            const table = new Table({
                head: ['Name', 'Display Name', 'Latest Version'],
                colWidths: [30, 30]
            });
            simplifiedResult.forEach((piece) => {
                table.push([piece.name, piece.displayName, piece.version]);
            });
            logger.info("\n" + table.toString());
        }
    },
    async delete({ pieceName }: { pieceName: string }): Promise<void> {
        const config = await authCommands.getToken();
        const { confirmDelete } = await prompts({
            type: 'confirm',
            name: 'confirmDelete',
            message: `Are you sure you want to delete all versions of the '${pieceName}' piece?`
        });
        if (!confirmDelete) {
            logger.info(chalk.yellow("Delete cancelled."));
            return;
        }
        const response = await fetch(`${config.apiUrl}/v1/pieces/${pieceName}`, {
            headers: {
                'Authorization': `Bearer ${config.token}`
            },
        });
        if (response.status === 404) {
            logger.info(chalk.yellow(`Piece '${pieceName}' not found.`));
            return;
        } else if (response.status !== 200) {
            logger.info(chalk.red(`Error deleting piece '${pieceName}'.`));
            return;
        }
        logger.info(chalk.green(`Piece '${pieceName}' deleted. ` + JSON.stringify(await response.json())));
    },
    async publish({ pieceName }: { pieceName: string }): Promise<void> {
        const config = await authCommands.getToken();
        const workdir = process.cwd();
        const pieceDirectory = `${workdir}/packages/pieces/${pieceName}`;
        logger.info(chalk.blue("Packaging the piece into a tar file from " + pieceDirectory));
        if (!fs.existsSync(`${pieceDirectory}/package.json`)) {
            logger.error(chalk.red("The package.json file is missing in the current directory. Please run this command in the piece directory."));
            return;
        }

        const npmPackOutput = JSON.parse(execSync(`npm pack --json`, { encoding: 'utf-8', cwd: pieceDirectory }));
        const tarFileName = npmPackOutput[0].filename;
        logger.info(chalk.green(`Package ${tarFileName} created.`));


        const formData = new FormData();
        formData.append('tarFile', fs.createReadStream(`${pieceDirectory}/${tarFileName}`));
        
        const response = await fetch(`${config.apiUrl}/v1/pieces`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                ...formData.getHeaders()
            },
            // TODO FIX BODY
        });
        if(response.status === 409) {
            logger.info(chalk.red(`Piece with name and version already exists. Please increment the version in the package.json file.`));
            return;
        }
        if(response.status !== 200) {
            logger.info(chalk.red(`Error publishing piece '${pieceName}'.`));
            return;
        }
        logger.info(chalk.green(`Piece '${pieceName}' published.`));
    }
}