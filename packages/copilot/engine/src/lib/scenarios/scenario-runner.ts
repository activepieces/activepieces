import { FlowType } from '../types/flow-outline';
import { Agent } from '../types/agent';
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

    const result = {
      prompt: scenario.prompt(),
      output: output,
    };

    // Emit test result through the agent's callback
    if (agent.onTestResult) {
      agent.onTestResult({
        type: 'SCENARIO_COMPLETED',
        data: {
          title: scenario.title,
          ...result,
          timestamp: new Date().toISOString()
        }
      });
    }

    results.push(result);
  }

  const summary = {
    totalScenarios: scenarios.length,
    completedAt: new Date().toISOString()
  };

  console.log(chalk.bold(`\n📊 Summary: ${scenarios.length} scenarios ran\n`));

  // Emit summary through the agent's callback
  if (agent.onTestResult) {
    agent.onTestResult({
      type: 'TEST_SUMMARY',
      data: summary
    });
  }

  return results;
}
