import { writeFile } from 'node:fs/promises';
import chalk from 'chalk';
import { Command } from 'commander';
import { assertPieceExists, buildPackage, findPiece, findPieces, piecesPath } from '../utils/piece-utils';
import { makeFolderRecursive, readPackageJson } from '../utils/files';
import { basename, join } from 'node:path';
import { exec } from '../utils/exec';
import { Piece, pieceTranslation } from '@activepieces/pieces-framework';
import { MAX_KEY_LENGTH_FOR_CORWDIN } from '@activepieces/shared';

const findPieceInModule= async (pieceOutputFile: string): Promise<Piece> => {
    const module = await import(pieceOutputFile);
    const exports = Object.values(module);
    for (const e of exports) {
      if (isPiece(e)) {
          return e 
      }
      }
  
      throw new Error(`Piece not found in module, please check the piece output file ${pieceOutputFile}`);
}

function isPiece(value: unknown): value is Piece {
  return value instanceof Object && value.constructor.name === 'Piece'
}

const installDependencies = async (pieceFolder: string) => {
    console.log(chalk.blue(`Installing dependencies ${pieceFolder}`))
    await exec(`bun install`, {cwd: pieceFolder,})
    console.log(chalk.green(`Dependencies installed ${pieceFolder}`))
}


function getPropertyValue(object: Record<string, unknown>, path: string): unknown {
  const parsedKeys = path.split('.');
  if (parsedKeys[0] === '*') {
    return Object.values(object).map(item => getPropertyValue(item as Record<string, unknown>, parsedKeys.slice(1).join('.'))).filter(Boolean).flat()
  }
  const nextObject = object[parsedKeys[0]] as Record<string, unknown>;
  if (nextObject && parsedKeys.length > 1) {
    return getPropertyValue(nextObject, parsedKeys.slice(1).join('.'));
  }
  return nextObject;
}

const generateTranslationFileFromPiece = (piece: ReturnType<Piece['metadata']>) => { const translation: Record<string, string> = {}
  try {
    pieceTranslation.pathsToTranslate(piece.categories).forEach(path => {
      const value = getPropertyValue(piece, path)
      if (value) {
        if (typeof value === 'string') {
          translation[value.slice(0, MAX_KEY_LENGTH_FOR_CORWDIN)] = value
        }
        else if (Array.isArray(value)) {
          value.forEach(item => {
            translation[item.slice(0, MAX_KEY_LENGTH_FOR_CORWDIN)] = item
          })
        }
      }
    })
  }
  catch (err) {
    console.error(`error generating translation file for piece ${piece.displayName}:`, err)
  }

  return translation
}



const generateTranslationFile = async (pieceName: string) => {
  const pieceRoot = await findPiece(pieceName)
  assertPieceExists(pieceRoot)
  const packageJson = await readPackageJson(pieceRoot)
  await buildPackage(packageJson.name)
  try{
    await installDependencies(pieceRoot)
    const pieceFromModule = await findPieceInModule(pieceRoot);
    const i18n = generateTranslationFileFromPiece(pieceFromModule.metadata());
    const i18nFolder = join(pieceRoot, 'src', 'i18n')
    await makeFolderRecursive(i18nFolder);
    await writeFile(join(i18nFolder, 'translation.json'), JSON.stringify(i18n, null, 2));
    console.log(chalk.yellow('✨'), `Translation file for piece created in ${i18nFolder}`);
  } catch (error) {
    console.error(chalk.red('❌'), `Error generating translation file for piece ${pieceName}, make sure you built the piece`,error);
  }
};


export const generateTranslationFileForPieceCommand = new Command('generate-translation-file')
  .description('Generate i18n for a piece')
  .argument('<pieceName>', 'The name of the piece to generate i18n for')
  .action(async (pieceName: string) => {
    await generateTranslationFile(pieceName);
  });
  export const generateTranslationFileForAllPiecesCommand = new Command('generate-translation-file-for-all-pieces')
  .description('Generate i18n for all pieces')
  .requiredOption('--shard-index <shardIndex>', 'Zero-based shard index to process', (value) => parseInt(value, 10))
  .requiredOption('--shard-total <shardTotal>', 'Total number of shards', (value) => parseInt(value, 10))
  .action(async ({shardIndex, shardTotal}: { shardIndex: number; shardTotal: number }) => {
    const piecesDirectories = ['community', 'core'].map(folder => join(piecesPath(), folder))
    const pieces = (await Promise.all(piecesDirectories.map(directory => findPieces(directory)))).flat().map(piece => basename(piece));
    let totalTime = 0
    let indexAcrossAllPieces = 0
    for (const piece of pieces) {
      if ((indexAcrossAllPieces % shardTotal) !== shardIndex) {
        indexAcrossAllPieces++
        continue
      }
      const time= performance.now()
      await generateTranslationFile(piece);
      console.log(chalk.yellow('✨'), `Translation file for piece ${piece} created in ${(performance.now() - time)/1000}s`)
      totalTime += (performance.now() - time)/1000
      indexAcrossAllPieces++
    }
    console.log(chalk.yellow('✨'), `Total time taken to generate translation files for selected pieces: ${totalTime}s`)
  });
