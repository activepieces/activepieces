import chalk from 'chalk';
import { Command } from 'commander';
import { mkdir, readdir, writeFile } from 'fs/promises';
import inquirer from 'inquirer';
import path from 'node:path';

const validatePieceName = async (pieceName: string) => {
  console.log(chalk.yellow('Validating piece name....'));
  const pieceNamePattern = /^(?![._])[a-z0-9-]{1,214}$/;
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
  const piecePath = path.resolve('packages', 'pieces', 'community', pieceName);
  try {
    await readdir(piecePath);
    console.log(chalk.red(`🚨 Piece already exists at ${piecePath}`));
    process.exit(1);
  } catch {
    // Directory does not exist, which is expected
  }
};

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const scaffoldPiece = async (
  pieceName: string,
  packageName: string,
  pieceType: string
) => {
  const baseDir = path.resolve('packages', 'pieces', pieceType, pieceName);
  const srcDir = path.join(baseDir, 'src');
  const libDir = path.join(srcDir, 'lib');
  const i18nDir = path.join(srcDir, 'i18n');

  // Create directory structure
  await mkdir(libDir, { recursive: true });
  await mkdir(i18nDir, { recursive: true });

  // Create package.json
  const packageJson = {
    name: packageName,
    version: '0.0.1',
    type: 'commonjs',
    scripts: {
      build: 'tsc -p tsconfig.lib.json',
      lint: "eslint 'src/**/*.ts'",
    },
  };
  await writeFile(
    path.join(baseDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create tsconfig.json
  const tsconfig = {
    extends: '../../../../tsconfig.base.json',
    compilerOptions: {
      module: 'commonjs',
      forceConsistentCasingInFileNames: true,
      strict: true,
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
    },
    files: [],
    include: [],
    references: [
      { path: './tsconfig.lib.json' },
    ],
  };
  await writeFile(
    path.join(baseDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );

  // Create tsconfig.lib.json
  const tsconfigLib = {
    extends: './tsconfig.json',
    compilerOptions: {
      outDir: `../../../../dist/packages/pieces/${pieceType}/${pieceName}`,
      declaration: true,
      types: ['node'],
    },
    include: ['src/**/*.ts'],
    exclude: ['jest.config.ts', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
  };
  await writeFile(
    path.join(baseDir, 'tsconfig.lib.json'),
    JSON.stringify(tsconfigLib, null, 2)
  );

  // Create .eslintrc.json
  const eslintConfig = {
    extends: ['../../../../.eslintrc.base.json'],
    ignorePatterns: ['!**/*'],
    overrides: [
      { files: ['*.ts', '*.tsx', '*.js', '*.jsx'], rules: {} },
      { files: ['*.ts', '*.tsx'], rules: {} },
      { files: ['*.js', '*.jsx'], rules: {} },
    ],
  };
  await writeFile(
    path.join(baseDir, '.eslintrc.json'),
    JSON.stringify(eslintConfig, null, 2)
  );

  // Create index.ts
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

  await writeFile(path.join(srcDir, 'index.ts'), indexTemplate);
};

export const createPiece = async (
  pieceName: string,
  packageName: string,
  pieceType: string
) => {
  await validatePieceName(pieceName);
  await validatePackageName(packageName);
  await checkIfPieceExists(pieceName);
  await scaffoldPiece(pieceName, packageName, pieceType);
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
        default: (answers: Record<string, string>) => `@activepieces/piece-${answers.pieceName}`,
        when: (answers: Record<string, string>) => answers.pieceName !== undefined,
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
