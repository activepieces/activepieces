import { runScenarios } from './lib/scenarios/scenario-runner';
import { plannerAgent } from './lib/agents/planner';
import { generatePiecesEmbeddings } from './lib/embeddings';
import dotenv from 'dotenv';
import { compileExamples } from './lib/examples';
dotenv.config();

const args = process.argv.slice(2);
if (args.includes('--compile')) {
  compileExamples();
} else if (args.includes('--generate-embeddings')) {
  generatePiecesEmbeddings()
    .then(() => console.log('Embeddings generation completed'))
    .catch(error => {
      console.error('Error generating embeddings:', error);
      process.exit(1);
    });
} else {
  runScenarios(plannerAgent);
}
