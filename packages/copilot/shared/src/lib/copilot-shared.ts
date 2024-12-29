export enum WebsocketEventTypes {
  RUN_TESTS = 'RUN_TESTS',
  UPDATE_RESULTS = 'UPDATE_RESULTS',
  RESPONSE_GET_STATE = 'RESPONSE_GET_STATE'
}

export interface BaseAgentConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  maxSteps: number;
  tools: Array<{
    name: string;
    function: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required: string[];
    };
  }>;
  systemPrompt: string;
  guidelines: string[];
  requirements: string[];
  outputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface RunTestsParams {
  scenarioTitle: string;
  agentConfig?: BaseAgentConfig;
}

export interface TestResultBase {
  timestamp: string;
  scenarioTitle?: string;
  title?: string;
  prompt?: string;
}

export interface PiecesFoundData extends TestResultBase {
  relevantPieces: {
    pieceName: string;
    content: string;
    logoUrl?: string;
    relevanceScore: number;
  }[];
}

export interface PlanGeneratedData extends TestResultBase {
  plan: {
    name: string;
    description: string;
    steps: {
      type: string;
      pieceName: string;
      actionOrTriggerName?: string;
      condition?: string;
    }[];
  };
}

export interface StepCreatedData extends TestResultBase {
  step: {
    name: string;
    type: string;
    piece?: {
      pieceName: string;
      actionName?: string;
      triggerName?: string;
    };
    input?: Record<string, any>;
    children?: any[];
  };
}

export interface ScenarioCompletedData extends TestResultBase {
  output: any;
}

export interface TestErrorData extends TestResultBase {
  error: string;
}

export interface TestStateData extends TestResultBase {
  isRunning: boolean;
  message?: string;
}

export enum WebsocketCopilotUpdate {
  TEST_DONE = 'TEST_DONE',
  TEST_ERROR = 'TEST_ERROR',
  TEST_STARTED = 'TEST_STARTED',
  PIECES_FOUND = 'PIECES_FOUND',
  ERROR = 'ERROR',
  AGENT_TEST_COMPLETED = 'AGENT_TEST_COMPLETED'
}

export type WebsocketCopilotResult = {
  type: WebsocketCopilotUpdate;
  data: any;
}

export interface PlanStep {
  type: 'PIECE_TRIGGER' | 'PIECE' | 'ROUTER';
  description: string;
  required: boolean;
}

export interface StepConfig {
  steps: PlanStep[];
}

export interface PlannerPromptTemplate {
  system: string;
  context: string;
  request: string;
  defaultGuidelines: string[];
  requirements: string[];
  important: string[];
}


