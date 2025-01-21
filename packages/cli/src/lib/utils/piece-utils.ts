import { readdir, stat } from 'node:fs/promises'
import * as path from 'path'
import { cwd } from 'node:process'
import { readPackageJson, readProjectJson } from './files'
import { exec } from './exec'
import axios, { AxiosError } from 'axios'
import chalk from 'chalk'
import FormData from 'form-data';
import fs from 'fs';

export async function findAllPieces(inputPath?: string): Promise<string[]> {
    const piecesPath = inputPath ?? path.join(cwd(), 'packages', 'pieces')
    const paths = await traverseFolder(piecesPath)
    return paths
}
export async function findPieceSourceDirectory(pieceName: string): Promise<string | null> {
    const piecesPath =  await findAllPieces()
    const piecePath = piecesPath.find((p) => {
        const normalizedPath = path.normalize(p);
        return normalizedPath.endsWith(path.sep + pieceName);
    });
    return piecePath ?? null
}


export async function buildPiece(pieceFolder: string): Promise<{ outputFolder: string, outputFile: string }> {
    const projectJson = await readProjectJson(pieceFolder);

    await exec(`npx nx build ${projectJson.name} --skip-cache && cd ${path.resolve('dist/packages' + pieceFolder.split('/packages')[1])}`);
    const compiledPath = path.resolve('dist/packages' + pieceFolder.split('/packages')[1]);

    const { stdout } = await exec('cd ' + compiledPath + ' && npm pack --json');
    const tarFileName = JSON.parse(stdout)[0].filename;
    return {
        outputFolder: compiledPath,
        outputFile: path.join(compiledPath, tarFileName)
    };
}

export async function publishPieceFromFolder(pieceFolder: string, apiUrl: string, apiKey: string) {
    const projectJson = await readProjectJson(pieceFolder);
    const packageJson = await readPackageJson(pieceFolder);

    await exec(`npx nx build ${projectJson.name} --skip-cache`);

    const { outputFile } = await buildPiece(pieceFolder);
    const formData = new FormData();

    console.log(chalk.blue(`Uploading ${outputFile}`));
    formData.append('pieceArchive', fs.createReadStream(outputFile));
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
async function traverseFolder(folderPath: string): Promise<string[]> {
    const paths: string[] = []
    const directoryExists = await stat(folderPath).catch(() => null)

    if (directoryExists && directoryExists.isDirectory()) {
        const files = await readdir(folderPath)

        for (const file of files) {
            const filePath = path.join(folderPath, file)
            const fileStats = await stat(filePath)
            if (fileStats.isDirectory() && file !== 'node_modules' && file !== 'dist') {
                paths.push(...await traverseFolder(filePath))
            }
            else if (file === 'package.json') {
                paths.push(folderPath)
            }
        }
    }
    return paths
}

export function displayNameToKebabCase(displayName: string): string {
    return displayName.toLowerCase().replace(/\s+/g, '-');
}

export function displayNameToCamelCase(input: string): string {
    const words = input.split(' ');
    const camelCaseWords = words.map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      } else {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
    });
    return camelCaseWords.join('');
  }
