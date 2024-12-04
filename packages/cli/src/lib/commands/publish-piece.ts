import { Command } from "commander";
import { findAllPieces } from "../utils/piece-utils";
import { readPackageJson, readProjectJson } from "../utils/files";
import path, { join } from "path";
import { exec } from "../utils/exec";
import FormData from 'form-data';
import fs from 'fs';
import chalk from "chalk";
import axios, { AxiosError } from 'axios';

async function publishPieces(apiUrl: string, apiKey: string, pieceName: string) {
    const piecesFolder = await findAllPieces(join(process.cwd(), 'packages', 'pieces', 'custom', pieceName));

    if (piecesFolder.length === 0) {
        console.error(chalk.red(`Piece '${pieceName}' not found.`));
        process.exit(1);
    }

    const projectJson = await readProjectJson(piecesFolder[0]);
    const packageJson = await readPackageJson(piecesFolder[0]);

    await exec(`npx nx build ${projectJson.name} --skip-cache`);

    const compiledPath = path.resolve('dist/packages' + piecesFolder[0].split('/packages')[1]);
    const { stdout } = await exec('cd ' + compiledPath + ' && npm pack --json');
    const tarFileName = JSON.parse(stdout)[0].filename;
    const formData = new FormData();

    console.log('Uploading ' + tarFileName);
    
    formData.append('pieceArchive', fs.createReadStream(join(compiledPath, tarFileName)));
    formData.append('pieceName', packageJson.name);
    formData.append('pieceVersion', packageJson.version);
    formData.append('packageType', 'ARCHIVE');
    formData.append('scope', 'PLATFORM');

    try {
        await axios.post(`${apiUrl}/v1/pieces`, formData, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                ...formData.getHeaders()
            }
        });
        console.info(chalk.green(`Piece '${packageJson.name}' published.`));
    } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
            if (axiosError.response.status === 409) {
                console.info(chalk.yellow(`Piece '${packageJson.name}' and '${packageJson.version}' already published.`));
            } else if (Math.floor(axiosError.response.status / 100) !== 2) {
                console.info(chalk.red(`Error publishing piece '${packageJson.name}', ` + JSON.stringify(axiosError.response.data)));
            } else {
                console.error(chalk.red(`Unexpected error: ${error.message}`));
            }
        } else {
            console.error(chalk.red(`Unexpected error: ${error.message}`));
        }
    }
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
