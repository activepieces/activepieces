import { runScenarios } from './lib/scenarios/scenario-runner';
import { plannerAgent } from './lib/agents/planner';
import { generatePiecesEmbeddings } from './lib/embeddings';
import dotenv from 'dotenv';
import { compileExamples } from './lib/examples';
import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

dotenv.config();

// Create an event emitter for test results
const testEventEmitter = new EventEmitter();
const wss = new WebSocketServer({ port: 3002 });

// Track active test runs
let isTestRunning = false;
let shouldStopTests = false;

async function runTests(ws: WebSocket) {
  if (isTestRunning) {
    ws.send(JSON.stringify({
      type: 'TEST_ERROR',
      data: {
        error: 'Tests are already running',
        timestamp: new Date().toISOString()
      }
    }));
    return;
  }

  isTestRunning = true;
  shouldStopTests = false;

  const modifiedPlannerAgent = {
    ...plannerAgent,
    onTestResult: (result: any) => {
      if (shouldStopTests) {
        throw new Error('Tests stopped by user');
      }
      ws.send(JSON.stringify(result));
      return plannerAgent.onTestResult?.(result);
    }
  };

  try {
    await runScenarios(modifiedPlannerAgent);
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'TEST_ERROR',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }));
  } finally {
    isTestRunning = false;
    shouldStopTests = false;
  }
}

function stopTests(ws: WebSocket) {
  if (!isTestRunning) {
    ws.send(JSON.stringify({
      type: 'TEST_ERROR',
      data: {
        error: 'No tests are currently running',
        timestamp: new Date().toISOString()
      }
    }));
    return;
  }

  shouldStopTests = true;
  ws.send(JSON.stringify({
    type: 'TEST_STOPPED',
    data: {
      message: 'Tests stopped by user',
      timestamp: new Date().toISOString()
    }
  }));
}

// WebSocket server setup
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial state
  ws.send(JSON.stringify({
    type: 'TEST_STATE',
    data: {
      isRunning: isTestRunning,
      timestamp: new Date().toISOString()
    }
  }));

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      switch (data.type) {
        case 'RUN_TESTS':
          console.log('Received test run request');
          await runTests(ws);
          break;
        case 'STOP_TESTS':
          console.log('Received test stop request');
          stopTests(ws);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
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
  // Initial test run
  const ws = Array.from(wss.clients)[0];
  if (ws) {
    runTests(ws);
  }
}
