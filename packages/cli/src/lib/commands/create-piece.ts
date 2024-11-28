import chalk from 'chalk';
import { Command } from 'commander';
import { readdir, unlink, writeFile } from 'fs/promises';
import inquirer from 'inquirer';
import assert from 'node:assert';
import { exec } from '../utils/exec';
import {
  readPackageEslint,
  readProjectJson,
  writePackageEslint,
  writeProjectJson,
} from '../utils/files';
import { findPieceSourceDirectory } from '../utils/piece-utils';

const validatePieceName = async (pieceName: string) => {
  console.log(chalk.yellow('Validating piece name....'));
  const pieceNamePattern = /^[A-Za-z0-9-]+$/;
  if (!pieceNamePattern.test(pieceName)) {
    console.log(
      chalk.red(
        `🚨 Invalid piece name: ${pieceName}. Piece names can only contain lowercase letters, numbers, and hyphens.`
      )
    );
    process.exit(1);
  }
};

const validatePackageName = async (packageName: string) => {
  console.log(chalk.yellow('Validating package name....'));
  const packageNamePattern = /^(?:@[a-zA-Z0-9-]+\/)?[a-zA-Z0-9-]+$/;
  if (!packageNamePattern.test(packageName)) {
    console.log(
      chalk.red(
        `🚨 Invalid package name: ${packageName}. Package names can only contain lowercase letters, numbers, and hyphens.`
      )
    );
    process.exit(1);
  }
};

const checkIfPieceExists = async (pieceName: string) => {
  const path = await findPieceSourceDirectory(pieceName);
  if (path) {
    console.log(chalk.red(`🚨 Piece already exists at ${path}`));
    process.exit(1);
  }
};

const nxGenerateNodeLibrary = async (
  pieceName: string,
  packageName: string,
  pieceType: string
) => {
  const nxGenerateCommand = [
    `npx nx generate @nx/node:library`,
    `--directory=packages/pieces/${pieceType}/${pieceName}`,
    `--name=pieces-${pieceName}`,
    `--importPath=${packageName}`,
    '--publishable',
    '--buildable',
    '--projectNameAndRootFormat=as-provided',
    '--strict',
    '--unitTestRunner=none',
  ].join(' ');

  console.log(chalk.blue(`🛠️ Executing nx command: ${nxGenerateCommand}`));

  await exec(nxGenerateCommand);
};

const removeUnusedFiles = async (pieceName: string, pieceType: string) => {
  const path = `packages/pieces/${pieceType}/${pieceName}/src/lib/`;
  const files = await readdir(path);
  for (const file of files) {
    await unlink(path + file);
  }
};
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
const generateIndexTsFile = async (pieceName: string, pieceType: string) => {
  const pieceNameCamelCase = pieceName
    .split('-')
    .map((s, i) => {
      if (i === 0) {
        return s;
      }

      return s[0].toUpperCase() + s.substring(1);
    })
    .join('');

  const indexTemplate = `
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    
    export const ${pieceNameCamelCase} = createPiece({
      displayName: "${capitalizeFirstLetter(pieceName)}",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/${pieceName}.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    `;

  await writeFile(
    `packages/pieces/${pieceType}/${pieceName}/src/index.ts`,
    indexTemplate
  );
};
const updateProjectJsonConfig = async (
  pieceName: string,
  pieceType: string
) => {
  const projectJson = await readProjectJson(
    `packages/pieces/${pieceType}/${pieceName}`
  );

  assert(
    projectJson.targets?.build?.options,
    '[updateProjectJsonConfig] targets.build.options is required'
  );

  projectJson.targets.build.options.buildableProjectDepsInPackageJsonType =
    'dependencies';
  projectJson.targets.build.options.updateBuildableProjectDepsInPackageJson =
    true;

    const lintFilePatterns = projectJson.targets.lint?.options?.lintFilePatterns;

    if (lintFilePatterns) {
    const patternIndex = lintFilePatterns.findIndex((item) =>
      item.endsWith('package.json')
    );
    if (patternIndex !== -1) lintFilePatterns?.splice(patternIndex, 1);
  } else {
  projectJson.targets.lint = {
    executor: '@nx/eslint:lint',
    outputs: ['{options.outputFile}'],
  };
}

  await writeProjectJson(
    `packages/pieces/${pieceType}/${pieceName}`,
    projectJson
  );
};
const updateEslintFile = async (pieceName: string, pieceType: string) => {
  const eslintFile = await readPackageEslint(
    `packages/pieces/${pieceType}/${pieceName}`
  );
  eslintFile.overrides.splice(
    eslintFile.overrides.findIndex((rule: any) => rule.files[0] == '*.json'),
    1
  );
  await writePackageEslint(
    `packages/pieces/${pieceType}/${pieceName}`,
    eslintFile
  );
};
const setupGeneratedLibrary = async (pieceName: string, pieceType: string) => {
  await removeUnusedFiles(pieceName, pieceType);
  await generateIndexTsFile(pieceName, pieceType);
  await updateProjectJsonConfig(pieceName, pieceType);
  await updateEslintFile(pieceName, pieceType);
};

export const createPiece = async (
  pieceName: string,
  packageName: string,
  pieceType: string
) => {
  await validatePieceName(pieceName);
  await validatePackageName(packageName);
  await checkIfPieceExists(pieceName);
  await nxGenerateNodeLibrary(pieceName, packageName, pieceType);
  await setupGeneratedLibrary(pieceName, pieceType);
  console.log(chalk.green('✨  Done!'));
  console.log(
    chalk.yellow(
      `The piece has been generated at: packages/pieces/${pieceType}/${pieceName}`
    )
  );
};

export const createPieceCommand = new Command('create')
  .description('Create a new piece')
  .action(async () => {
    const questions = [
      {
        type: 'input',
        name: 'pieceName',
        message: 'Enter the piece name:',
      },
      {
        type: 'input',
        name: 'packageName',
        message: 'Enter the package name:',
        default: (answers: any) => `@activepieces/piece-${answers.pieceName}`,
        when: (answers: any) => answers.pieceName !== undefined,
      },
      {
        type: 'list',
        name: 'pieceType',
        message: 'Select the piece type:',
        choices: ['community', 'custom'],
        default: 'community',
      },
    ];

    const answers = await inquirer.prompt(questions);
    createPiece(answers.pieceName, answers.packageName, answers.pieceType);
  });
