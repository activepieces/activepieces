import { Flow, FlowType } from '../types/flow-outline';
import chalk from 'chalk';
import { table, getBorderCharacters } from 'table';
import { scenarios } from '.';

type EvaluationResult = {
  prompt: string;
  output: FlowType;
};

export async function runScenarios(agent: Agent<FlowType>) {
  const results: EvaluationResult[] = [];
  console.log(chalk.bold.blue('\n🚀 Running Scenarios...\n'));

  const tableConfig = {
    border: getBorderCharacters('ramac'),
    columns: {
      0: { width: 40 },
      1: { width: 90 },
    },
  };

  for (const scenario of scenarios) {
    console.log(chalk.bold.yellow(`\nRunning scenario: ${scenario.title}\n`));

    const output = await agent.plan(scenario.prompt());

    const currentTable = [
      [chalk.cyan('Prompt'), chalk.cyan('Output')],
      [
        chalk.gray(scenario.prompt()),
        chalk.yellow(JSON.stringify(output, null, 2)),
      ]
    ];

    console.log(table(currentTable, tableConfig));

    results.push({
      prompt: scenario.prompt(),
      output: output,
    });
  }

  console.log(chalk.bold(`\n📊 Summary: ${scenarios.length} scenarios ran\n`));

  return results;
}
