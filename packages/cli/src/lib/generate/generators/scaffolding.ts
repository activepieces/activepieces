import { GeneratorContext } from '../types';

export function generateScaffolding({ ctx }: { ctx: GeneratorContext }): Record<string, string> {
  const depth = ctx.pieceType === 'community' ? '../../../../' : '../../../';

  const packageJson = {
    name: ctx.packageName,
    version: '0.0.1',
    type: 'commonjs',
    main: './dist/src/index.js',
    types: './dist/src/index.d.ts',
    dependencies: {
      '@activepieces/pieces-common': 'workspace:*',
      '@activepieces/pieces-framework': 'workspace:*',
      '@activepieces/shared': 'workspace:*',
      tslib: '2.6.2',
    },
    scripts: {
      build: 'tsc -p tsconfig.lib.json && cp package.json dist/',
      lint: "eslint 'src/**/*.ts'",
    },
  };

  const tsconfig = {
    extends: `${depth}tsconfig.base.json`,
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
    references: [{ path: './tsconfig.lib.json' }],
  };

  const tsconfigLib = {
    extends: './tsconfig.json',
    compilerOptions: {
      rootDir: '.',
      baseUrl: '.',
      paths: {},
      outDir: './dist',
      declaration: true,
      declarationMap: true,
      types: ['node'],
    },
    include: ['src/**/*.ts'],
    exclude: ['jest.config.ts', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
  };

  const eslintConfig = {
    extends: [`${depth}.eslintrc.json`],
    ignorePatterns: ['!**/*'],
    overrides: [
      { files: ['*.ts', '*.tsx', '*.js', '*.jsx'], rules: {} },
      { files: ['*.ts', '*.tsx'], rules: {} },
      { files: ['*.js', '*.jsx'], rules: {} },
    ],
  };

  return {
    'package.json': JSON.stringify(packageJson, null, 2),
    'tsconfig.json': JSON.stringify(tsconfig, null, 2),
    'tsconfig.lib.json': JSON.stringify(tsconfigLib, null, 2),
    '.eslintrc.json': JSON.stringify(eslintConfig, null, 2),
  };
}
