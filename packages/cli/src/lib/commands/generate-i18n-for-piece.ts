import { writeFile } from 'node:fs/promises';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { assertPieceExists, buildPackage, buildPiece, findPiece } from '../utils/piece-utils';
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

const generateI18nFromPiecesFramework = async () => {
 await buildPackage('pieces-framework')
 const outputFolder = path.join(process.cwd(), 'dist', 'packages', 'pieces','community','framework')
 await installDependencies(outputFolder)
 const pkg = await import(outputFolder)
 return pkg.generateI18n;
}


const generateI18nForPiece = async (pieceName: string) => {
  const pieceFolder = await findPiece(pieceName);
  const distPieceFolder = pieceFolder.replace('packages/', 'dist/packages/')
  assertPieceExists(pieceFolder)
  console.log(chalk.blue(`building piece ${pieceFolder}`))
  await buildPiece(pieceFolder);
  console.log(chalk.green(`finished building piece ${pieceFolder}`))
  await installDependencies(distPieceFolder)
  const pieceFromModule = await findPieceInModule(distPieceFolder);
  const generateI18n = await generateI18nFromPiecesFramework();
  const i18n = generateI18n({actions: (pieceFromModule as any)._actions, triggers: (pieceFromModule as any)._triggers, description: (pieceFromModule as any).description, displayName: (pieceFromModule as any).displayName, auth: (pieceFromModule as any).auth});
  const i18nFolder = join(pieceFolder, 'src', 'i18n')
  await makeFolderRecursive(i18nFolder);
  await writeFile(join(i18nFolder, 'i18n.json'), JSON.stringify(i18n, null, 2));
  console.log(chalk.yellow('✨'), `Translation file for piece ${pieceName} created`);
};


export const generateI18nForPieceCommand = new Command('generate-translation-file')
  .description('Generate i18n for a piece')
  .action(async () => {
    const questions = [
      {
        type: 'input',
        name: 'pieceName',
        message: 'Enter the piece folder name:',
        placeholder: 'google-drive',
      },
    ];

    const answers = await inquirer.prompt(questions);
    generateI18nForPiece(answers.pieceName);
  });



  