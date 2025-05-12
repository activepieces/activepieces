import { writeFile } from 'node:fs/promises';
import chalk from 'chalk';
import { Command } from 'commander';
import { buildPackage, buildPiece, findPiece } from '../utils/piece-utils';
import { makeFolderRecursive } from '../utils/files';
import path, { join } from 'node:path';
import { exec } from '../utils/exec';


const findPieceInModule= async (pieceOutputFile: string) => {
 try { 
    const module = await import(pieceOutputFile);
    const exports = Object.values(module);
    for (const e of exports) {
      if (e !== null && e !== undefined && e.constructor.name === 'Piece') {
          return e 
      }
      }
  
      throw new Error(`Piece not found in module, please check the piece output file ${pieceOutputFile}`);
 } catch (error) {
    throw error;
 }
}

const installDependencies = async (pieceFolder: string) => {
    console.log(chalk.blue(`Installing dependencies ${pieceFolder}`))
    await exec(`npm install`, {cwd: pieceFolder,})
    console.log(chalk.green(`Dependencies installed ${pieceFolder}`))
}

const generateTrasnlationFileFromPiecesFramework = async () => {
 await buildPackage('pieces-framework')
 const outputFolder = path.join(process.cwd(), 'dist', 'packages', 'pieces','community','framework')
 await installDependencies(outputFolder)
 const pkg = await import(outputFolder)
 return pkg.generateTranslationFile;
}


const generateTranslationFile = async (pieceName: string) => {
  const pieceRoot = await findPiece(pieceName)
  console.log(chalk.blue(`building piece ${pieceRoot}`))
  await buildPiece(pieceRoot);
  console.log(chalk.green(`finished building piece ${pieceRoot}`))
  const outputFolder = pieceRoot.replace('packages/', 'dist/packages/')
  await installDependencies(outputFolder)
  const pieceFromModule = await findPieceInModule(outputFolder);
  const generateTranslationFile = await generateTrasnlationFileFromPiecesFramework();
  const i18n = generateTranslationFile({actions: (pieceFromModule as any)._actions, triggers: (pieceFromModule as any)._triggers, description: (pieceFromModule as any).description, displayName: (pieceFromModule as any).displayName, auth: (pieceFromModule as any).auth});
  const i18nFolder = join(pieceRoot, 'src', 'i18n')
  await makeFolderRecursive(i18nFolder);
  await writeFile(join(i18nFolder, 'translation.json'), JSON.stringify(i18n, null, 2));
  console.log(chalk.yellow('✨'), `Translation file for piece created in ${i18nFolder}`);
};


export const generateTranslationFileForPieceCommand = new Command('generate-translation-file')
  .description('Generate i18n for a piece')
  .argument('<pieceName>', 'The name of the piece to generate i18n for')
  .action(async (pieceName: string) => {
    await generateTranslationFile(pieceName);
  });



  