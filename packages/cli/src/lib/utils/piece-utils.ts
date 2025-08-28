import { readdir, stat } from 'node:fs/promises'
import * as path from 'path'
import { cwd } from 'node:process'
import { readPackageJson, readProjectJson } from './files.js'
import { exec } from './exec.js'
import axios from 'axios'
import chalk from 'chalk'
import FormData from 'form-data';
import fs from 'fs';

export const piecesPath = () => path.join(cwd(), 'packages', 'pieces')
export const customPiecePath = () => path.join(piecesPath(), 'custom')

/**
 * Finds and returns the paths of specific pieces or all available pieces in a given directory.
 *
 * @param inputPath - The root directory to search for pieces. If not provided, a default path to custom pieces is used.
 * @param pieces - An optional array of piece names to search for. If not provided, all pieces in the directory are returned.
 * @returns A promise resolving to an array of strings representing the paths of the found pieces.
 */
export async function findPieces(inputPath?: string, pieces?: string[]): Promise<string[]> {
    const piecesPath = inputPath ?? customPiecePath()
    const piecesFolders = await traverseFolder(piecesPath)
    if (pieces) {
        return pieces.flatMap((piece) => {
          const folder = piecesFolders.find((p) => {
              const normalizedPath = path.normalize(p);
              return normalizedPath.endsWith(path.sep + piece);
          });
          if (!folder) {
              return [];
          }
          return [folder];
      });
    } else {
        return piecesFolders
    }
}

/**
 * Finds and returns the path of a single piece. Exits the process if the piece is not found.
 *
 * @param pieceName - The name of the piece to search for.
 * @returns A promise resolving to a string representing the path of the found piece. If not found, the process exits.
 */
export async function findPiece(pieceName: string): Promise<string | null> {
    return (await findPieces(piecesPath(), [pieceName]))[0] ?? null;
}

export async function buildPiece(pieceFolder: string): Promise<{ outputFolder: string, outputFile: string }> {
    const projectJson = await readProjectJson(pieceFolder);

    await buildPackage(projectJson.name);
     
    const compiledPath = `dist/packages/${removeStartingSlashes(pieceFolder).split(path.sep + 'packages')[1]}`;

    const { stdout } = await exec('npm pack --json', { cwd: compiledPath });
    const tarFileName = JSON.parse(stdout)[0].filename;
    return {
        outputFolder: compiledPath,
        outputFile: path.join(compiledPath, tarFileName)
    };
}

export async function buildPackage(projectName:string) {
    await exec(`npx nx build ${projectName} --skip-cache`);
    return {
        outputFolder: `dist/packages/${projectName}`,
    }
}

export async function publishPieceFromFolder(
    {pieceFolder, apiUrl, apiKey, failOnError}:
  {pieceFolder: string,
  apiUrl: string,
  apiKey: string,
  failOnError: boolean,}
) {
    const projectJson = await readProjectJson(pieceFolder);
    const packageJson = await readPackageJson(pieceFolder);

    await buildPackage(projectJson.name);

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
     
        if (axios.isAxiosError(error)) {
            if (error.response.status === 409) {
                console.info(chalk.yellow(`Piece '${packageJson.name}' and '${packageJson.version}' already published.`));
            } else if (Math.floor(error.response.status / 100) !== 2) {
                console.info(chalk.red(`Error publishing piece '${packageJson.name}',  ${error}` ));
                if (failOnError) {
                    console.info(chalk.yellow(`Terminating process due to publish failure for piece '${packageJson.name}' (fail-on-error is enabled)`));
                    process.exit(1);
                }
            } else {
                console.error(chalk.red(`Unexpected error: ${error.message}`));
                if (failOnError) {
                    console.info(chalk.yellow(`Terminating process due to unexpected error for piece '${packageJson.name}' (fail-on-error is enabled)`));
                    process.exit(1);
                }
            }
        } else {
            console.error(chalk.red(`Unexpected error: ${error.message}`));
            if (failOnError) {
              console.info(chalk.yellow(`Terminating process due to unexpected error for piece '${packageJson.name}' (fail-on-error is enabled)`));
              process.exit(1);
            }
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

export const assertPieceExists = async (pieceName: string | null) => {
    if (!pieceName) {
      console.error(chalk.red(`🚨 Piece ${pieceName} not found`));
      process.exit(1);
    }
  };


  export const removeStartingSlashes = (str: string) => {
    return str.startsWith('/') ? str.slice(1) : str;
  }