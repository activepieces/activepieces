import { runScenarios } from './lib/scenarios/scenario-runner';
import { plannerAgent } from './lib/agents/planner';
import dotenv from 'dotenv';
import { compileExamples } from './lib/examples';
dotenv.config();

const args = process.argv.slice(2);
if (args.includes('--compile')) {
  compileExamples();
} else {
  runScenarios(plannerAgent);
}
