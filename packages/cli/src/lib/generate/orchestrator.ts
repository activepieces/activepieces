import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';
import { specLoader } from './loader';
import { authExtractor } from './auth-extractor';
import { opExtractor } from './op-extractor';
import { DynamicDropdownConfig, GeneratorContext, ParsedSpec } from './types';
import { generateAuth } from './generators/auth';
import { generateCommon } from './generators/common';
import { generateAction } from './generators/action';
import { generatePieceIndex } from './generators/piece-index';
import { generateScaffolding } from './generators/scaffolding';

export const orchestrator = { run };

async function run({
  specPath,
  pieceName,
  packageName,
  displayName,
  outputDir,
  pieceType,
  tags,
  dynamicDropdowns,
  dryRun,
}: {
  specPath: string;
  pieceName: string;
  packageName: string;
  displayName: string;
  outputDir: string;
  pieceType: string;
  tags?: string[];
  dynamicDropdowns?: Record<string, DynamicDropdownConfig>;
  dryRun: boolean;
}): Promise<void> {
  console.log(chalk.blue(`Loading spec from ${specPath}...`));
  const spec = await loadSpec({ specPath, displayName, tags });

  const ctx: GeneratorContext = { spec, pieceName, packageName, displayName, outputDir, pieceType, dynamicDropdowns };

  const files = collectFiles({ ctx });

  if (dryRun) {
    console.log(chalk.yellow('\n[dry-run] Files that would be generated:'));
    for (const [path] of files) console.log(chalk.gray(`  ${path}`));
    return;
  }

  await writeFiles({ files, outputDir });

  console.log(chalk.green(`\n✨ Piece '${pieceName}' generated at ${outputDir}`));
  console.log(chalk.yellow(`\nNext steps:`));
  console.log(chalk.white(`  1. Review generated files`));
  console.log(chalk.white(`  2. Add piece to tsconfig.base.json paths`));
  console.log(chalk.white(`  3. Run: cd ${outputDir} && npm run build`));
}

async function loadSpec({
  specPath,
  displayName,
  tags,
}: {
  specPath: string;
  displayName: string;
  tags?: string[];
}): Promise<ParsedSpec> {
  const raw = await specLoader.load({ filePath: specPath });
  const auth = authExtractor.extract({ spec: raw });
  const operations = opExtractor.extract({ spec: raw, tags });

  const baseUrl = raw.servers?.[0]?.url ?? 'https://api.example.com';

  console.log(chalk.blue(`  Auth: ${auth.kind}`));
  console.log(chalk.blue(`  Operations: ${operations.length}`));

  return {
    title: raw.info.title,
    description: raw.info.description ?? displayName,
    version: raw.info.version,
    baseUrl,
    auth,
    operations,
  };
}

function collectFiles({ ctx }: { ctx: GeneratorContext }): Map<string, string> {
  const files = new Map<string, string>();

  const scaffolding = generateScaffolding({ ctx });
  for (const [name, content] of Object.entries(scaffolding)) {
    files.set(name, content);
  }

  if (ctx.spec.auth.kind !== 'none') {
    files.set('src/lib/auth.ts', generateAuth({ ctx }));
  }

  files.set('src/lib/common.ts', generateCommon({ ctx }));

  for (const op of ctx.spec.operations) {
    files.set(`src/lib/actions/${op.fileName}.ts`, generateAction({ op, ctx }));
  }

  files.set('src/index.ts', generatePieceIndex({ ctx }));

  return files;
}

async function writeFiles({
  files,
  outputDir,
}: {
  files: Map<string, string>;
  outputDir: string;
}): Promise<void> {
  for (const [relativePath, content] of files) {
    const fullPath = join(outputDir, relativePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, content, { encoding: 'utf-8' });
    console.log(chalk.gray(`  wrote ${relativePath}`));
  }
}
