import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { orchestrator } from '../generate/orchestrator';
import { checkIfFileExists } from '../utils/files';

export const generateFromOpenApiCommand = new Command('from-openapi')
  .description('Generate a piece from an OpenAPI specification')
  .option('-s, --spec <path>', 'Path to OpenAPI spec (JSON or YAML)')
  .option('-n, --name <name>', 'Piece slug name (e.g. mixmax)')
  .option('-t, --type <type>', 'Piece type: community or custom', 'community')
  .option('--tags <tags>', 'Comma-separated OpenAPI tags to include (e.g. "Contacts,Deals")')
  .option('--dry-run', 'Print files without writing', false)
  .action(async (options: { spec?: string; name?: string; type?: string; tags?: string; dryRun?: boolean }) => {
    const answers = await gatherInputs({ options });
    await runGeneration({ answers });
  });

async function gatherInputs({
  options,
}: {
  options: { spec?: string; name?: string; type?: string; tags?: string; dryRun?: boolean };
}): Promise<GenerationAnswers> {
  const questions: inquirer.Question[] = [];

  if (!options.spec) {
    questions.push({
      type: 'input',
      name: 'spec',
      message: 'Path to OpenAPI spec file (JSON or YAML):',
    });
  }

  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Piece slug name (e.g. mixmax, my-api):',
    });
  }

  const prompted = questions.length > 0 ? await inquirer.prompt(questions) : {};

  const specPath = options.spec ?? (prompted as Record<string, string>)['spec'];
  const pieceName = (options.name ?? (prompted as Record<string, string>)['name']).toLowerCase();
  const pieceType = options.type ?? 'community';

  const displayName = pieceName
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

  const packageName = `@activepieces/piece-${pieceName}`;
  const outputDir = join(cwd(), 'packages', 'pieces', pieceType, pieceName);
  const tags = options.tags ? options.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined;

  return { specPath, pieceName, packageName, displayName, outputDir, pieceType, tags, dryRun: options.dryRun ?? false };
}

async function runGeneration({ answers }: { answers: GenerationAnswers }): Promise<void> {
  const { specPath, pieceName, packageName, displayName, outputDir, pieceType, tags, dryRun } = answers;

  if (!dryRun) {
    const exists = await checkIfFileExists(join(outputDir, 'package.json'));
    if (exists) {
      console.log(chalk.red(`🚨 Piece already exists at ${outputDir}. Use --dry-run to preview.`));
      process.exit(1);
    }
  }

  console.log(chalk.blue(`\nGenerating piece '${pieceName}' (${packageName})...`));

  try {
    await orchestrator.run({ specPath, pieceName, packageName, displayName, outputDir, pieceType, tags, dryRun });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`\n🚨 Generation failed: ${msg}`));
    process.exit(1);
  }
}

type GenerationAnswers = {
  specPath: string;
  pieceName: string;
  packageName: string;
  displayName: string;
  outputDir: string;
  pieceType: string;
  tags?: string[];
  dryRun: boolean;
};
