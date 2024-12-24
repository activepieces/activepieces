import { FlowType } from '../types/flow-outline';
import { Agent } from '../types/agent';
import chalk from 'chalk';
import { table, getBorderCharacters } from 'table';
import { scenarios } from '.';
import { Scenario } from '../types/scenario';

type EvaluationResult = {
  prompt: string;
  output: FlowType;
};

export async function runScenarios(agent: Agent<FlowType>, targetScenario?: Scenario<FlowType>) {
  const results: EvaluationResult[] = [];
  console.log(chalk.bold.blue('\n🚀 Running Scenarios...\n'));

  const tableConfig = {
    border: getBorderCharacters('ramac'),
    columns: {
      0: { width: 40 },
      1: { width: 90 },
    },
  };

  const scenariosToRun = targetScenario ? [targetScenario] : scenarios;

  for (const scenario of scenariosToRun) {
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
    totalScenarios: scenariosToRun.length,
    completedAt: new Date().toISOString()
  };

  console.log(chalk.bold(`\n📊 Summary: ${scenariosToRun.length} scenarios ran\n`));

  // Emit summary through the agent's callback
  if (agent.onTestResult) {
    agent.onTestResult({
      type: 'TEST_SUMMARY',
      data: summary
    });
  }

  return results;
}
