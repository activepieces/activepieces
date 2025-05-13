import { writeFile } from 'node:fs/promises';
import chalk from 'chalk';
import { Command } from 'commander';
import { findPiece } from '../utils/piece-utils';
import { makeFolderRecursive } from '../utils/files';
import { join } from 'node:path';
import { exec } from '../utils/exec';
// eslint-disable-next-line @nx/enforce-module-boundaries
import keys from '../../../../pieces/community/framework/translation-keys.json';

const findPieceInModule= async (pieceOutputFile: string) => {
    const module = await import(pieceOutputFile);
    const exports = Object.values(module);
    for (const e of exports) {
      if (e !== null && e !== undefined && e.constructor.name === 'Piece') {
          return e 
      }
      }
  
      throw new Error(`Piece not found in module, please check the piece output file ${pieceOutputFile}`);
}

const installDependencies = async (pieceFolder: string) => {
    console.log(chalk.blue(`Installing dependencies ${pieceFolder}`))
    await exec(`npm install`, {cwd: pieceFolder,})
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


const generateTranslationFileFromPiece = (piece: Record<string, unknown>) => { const translation: Record<string, string> = {}
  try {
    keys.forEach(key => {
      const value = getPropertyValue(piece, key)
      if (value) {
        if (typeof value === 'string') {
          translation[value] = value
        }
        else if (Array.isArray(value)) {
          value.forEach(item => {
            translation[item] = item
          })
        }
      }
    })
  }
  catch (err) {
    console.error(`error generating translation file for piece ${piece.name}:`, err)
  }

  return translation
}



const generateTranslationFile = async (pieceName: string) => {
  const pieceRoot = await findPiece(pieceName)
  const outputFolder = pieceRoot.replace('packages/', 'dist/packages/')
  try{
    await installDependencies(outputFolder)
    const pieceFromModule = await findPieceInModule(outputFolder);
    const i18n = generateTranslationFileFromPiece({actions: (pieceFromModule as any)._actions, triggers: (pieceFromModule as any)._triggers, description: (pieceFromModule as any).description, displayName: (pieceFromModule as any).displayName, auth: (pieceFromModule as any).auth});
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
