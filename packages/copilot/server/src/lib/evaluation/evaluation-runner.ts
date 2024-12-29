import { Socket } from "socket.io";
import { 
  BaseAgentConfig, 
  WebsocketCopilotResult, 
  WebsocketEventTypes, 
  WebsocketCopilotUpdate,

} from "@activepieces/copilot-shared";
import { createAgentFromConfig } from "../agents/agent-factory";


// =================== Types ===================
export interface TestCase {
  title: string;
  prompt: string;
  idealOutput: string;
}

interface TestCasesFile {
  testCases: TestCase[];
}

interface TestState {
  testCases: {
    title: string;
    prompt: string;
    status: 'running' | 'stopped';
  }[];
}

// =================== State Management ===================
let currentState: TestState = {
  testCases: []
};

// =================== Runner ===================
export async function runEvaluation(
  testCasesPath: string,
  agentConfig: BaseAgentConfig,
  socket: Socket | null
) {
  console.debug('[EvaluationRunner] Loading test cases from:', testCasesPath);

  try {
    // Load test cases from JSON file
    const testCasesFile: TestCasesFile = require(testCasesPath);
    const testCases: TestCase[] = testCasesFile.testCases;
    
    // Initialize state with loaded test cases
    currentState = {
      testCases: testCases.map(tc => ({
        title: tc.title,
        prompt: tc.prompt,
        status: 'stopped'
      }))
    };

    // Create agent from config
    const agent = createAgentFromConfig(agentConfig);
    if (!agent) {
      throw new Error('Agent is not available or disabled');
    }

    // Run each test case
    for (const testCase of testCases) {
      try {
        await updateTestState(socket, testCase.title, 'running');
        console.debug('[EvaluationRunner] Running test case:', testCase.title);

        const agentOptions = {
          temperature: 0.7, // Default temperature
        };

        const output = await agent.execute(testCase.prompt, socket, agentOptions);

        const result = {
          prompt: testCase.prompt,
          output: output,
          idealOutput: testCase.idealOutput,
          // Add comparison metrics here if needed
        };

        await updateTestState(socket, testCase.title, 'stopped');

        // Emit test result
        addResult(socket, {
          type: WebsocketCopilotUpdate.TEST_DONE,
          data: {
            title: testCase.title,
            ...result,
            timestamp: new Date().toISOString(),
          }
        });

      } catch (error) {
        console.error(`[EvaluationRunner] Error running test case ${testCase.title}:`, error);
        
        await updateTestState(socket, testCase.title, 'stopped');
        
        addResult(socket, {
          type: WebsocketCopilotUpdate.ERROR,
          data: {
            title: testCase.title,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }
        });
      }
    }
  } catch (error) {
    console.error('[EvaluationRunner] Error loading or parsing test cases:', error);
    throw error;
  }
}

// =================== WebSocket Utilities ===================
async function updateTestState(socket: Socket | null, testTitle: string, status: 'running' | 'stopped') {
  if (!socket) return;

  try {
    // Update global state
    const updatedState = {
      ...currentState,
      testCases: currentState.testCases.map((tc) => ({
        ...tc,
        status: tc.title === testTitle ? status : tc.status,
      })),
    };
    currentState = updatedState;
    socket.emit(WebsocketEventTypes.RESPONSE_GET_STATE, updatedState);

    // Emit test state event
    const testCase = currentState.testCases.find(tc => tc.title === testTitle);
    if (testCase) {
      addResult(socket, {
        type: WebsocketCopilotUpdate.TEST_DONE,
        data: {
          title: testCase.title,
          prompt: testCase.prompt,
          isRunning: status === 'running',
          timestamp: new Date().toISOString(),
        }
      });
    }
  } catch (error) {
    console.error('[EvaluationRunner] Error updating test state:', error);
    throw error;
  }
}

function addResult(socket: Socket | null, result: WebsocketCopilotResult) {
  if (!socket) return;
  socket.emit(WebsocketEventTypes.UPDATE_RESULTS, result);
}
