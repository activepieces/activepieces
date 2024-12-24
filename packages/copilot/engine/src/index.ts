import { runScenarios } from './lib/scenarios/scenario-runner';
import { plannerAgent } from './lib/agents/planner';
import { generatePiecesEmbeddings } from './lib/embeddings';
import dotenv from 'dotenv';
import { compileExamples } from './lib/examples';
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

dotenv.config();

// Create an event emitter for test results
const testEventEmitter = new EventEmitter();
const wss = new WebSocketServer({ port: 3002 });

// WebSocket server setup
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send test results to connected clients
  const sendTestResult = (result: any) => {
    ws.send(JSON.stringify(result));
  };

  testEventEmitter.on('testResult', sendTestResult);

  ws.on('close', () => {
    console.log('Client disconnected');
    testEventEmitter.off('testResult', sendTestResult);
  });

  ws.on('error', console.error);
});

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
  // Modify runScenarios to emit test results
  const modifiedPlannerAgent = {
    ...plannerAgent,
    onTestResult: (result: any) => {
      testEventEmitter.emit('testResult', result);
      return plannerAgent.onTestResult?.(result);
    }
  };

  runScenarios(modifiedPlannerAgent);
}
