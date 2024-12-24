import { runScenarios } from './lib/scenarios/scenario-runner';
import { plannerAgent } from './lib/agents/planner';
import { generatePiecesEmbeddings } from './lib/embeddings';
import dotenv from 'dotenv';
import { compileExamples } from './lib/examples';
import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { scenarios } from './lib/scenarios';

dotenv.config();

// Create an event emitter for test results
const testEventEmitter = new EventEmitter();
const wss = new WebSocketServer({ port: 3002 });

// Track active test runs
let isTestRunning = false;
let shouldStopTests = false;
let currentScenario: string | null = null;

async function runTests(ws: WebSocket, scenarioTitle?: string) {
  if (isTestRunning) {
    ws.send(JSON.stringify({
      type: 'TEST_ERROR',
      data: {
        error: 'Tests are already running',
        timestamp: new Date().toISOString(),
        scenarioTitle
      }
    }));
    return;
  }

  isTestRunning = true;
  shouldStopTests = false;
  currentScenario = scenarioTitle || null;

  const modifiedPlannerAgent = {
    ...plannerAgent,
    onTestResult: (result: any) => {
      if (shouldStopTests) {
        throw new Error('Tests stopped by user');
      }
      ws.send(JSON.stringify({
        ...result,
        data: {
          ...result.data,
          scenarioTitle: currentScenario
        }
      }));
      return plannerAgent.onTestResult?.(result);
    }
  };

  try {
    if (scenarioTitle) {
      // Run specific scenario
      const scenario = scenarios.find(s => s.title === scenarioTitle);
      
      if (!scenario) {
        throw new Error(`Scenario "${scenarioTitle}" not found`);
      }
      
      await runScenarios(modifiedPlannerAgent, scenario);
    } else {
      // Run all scenarios
      await runScenarios(modifiedPlannerAgent);
    }
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'TEST_ERROR',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        scenarioTitle: currentScenario
      }
    }));
  } finally {
    isTestRunning = false;
    shouldStopTests = false;
    currentScenario = null;
  }
}

function stopTests(ws: WebSocket) {
  if (!isTestRunning) {
    ws.send(JSON.stringify({
      type: 'TEST_ERROR',
      data: {
        error: 'No tests are currently running',
        timestamp: new Date().toISOString(),
        scenarioTitle: currentScenario
      }
    }));
    return;
  }

  shouldStopTests = true;
  ws.send(JSON.stringify({
    type: 'TEST_STOPPED',
    data: {
      message: 'Tests stopped by user',
      timestamp: new Date().toISOString(),
      scenarioTitle: currentScenario
    }
  }));
}

// Get available scenarios
function getScenarios() {
  return scenarios.map((scenario) => ({
    title: scenario.title,
    prompt: scenario.prompt()
  }));
}

// WebSocket server setup
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial state and available scenarios
  ws.send(JSON.stringify({
    type: 'TEST_STATE',
    data: {
      isRunning: isTestRunning,
      currentScenario,
      scenarios: getScenarios(),
      timestamp: new Date().toISOString()
    }
  }));

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      switch (data.type) {
        case 'RUN_TESTS':
          console.log('Received test run request', data.data?.scenarioTitle || 'all scenarios');
          await runTests(ws, data.data?.scenarioTitle);
          break;
        case 'STOP_TESTS':
          console.log('Received test stop request');
          stopTests(ws);
          break;
        case 'GET_SCENARIOS':
          console.log('Received scenarios request');
          ws.send(JSON.stringify({
            type: 'SCENARIOS',
            data: {
              scenarios: getScenarios(),
              timestamp: new Date().toISOString()
            }
          }));
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
}
