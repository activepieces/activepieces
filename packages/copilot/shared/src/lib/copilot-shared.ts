export enum WebsocketChannelTypes {
  UPDATE_RESULTS = 'UPDATE_RESULTS',
  RESPONSE_GET_STATE = 'RESPONSE_GET_STATE',
  GET_STATE = 'GET_STATE',
  GET_AGENT_REGISTRY = 'GET_AGENT_REGISTRY',
  RESPONSE_GET_AGENT_REGISTRY = 'RESPONSE_GET_AGENT_REGISTRY',
  UPDATE_AGENT_REGISTRY = 'UPDATE_AGENT_REGISTRY'
}

// Command-specific updates
export enum PieceCommandUpdate {
  PIECES_FOUND = 'PIECES_FOUND'
}


export enum AgentCommandUpdate {
  AGENT_TEST_STARTED = 'AGENT_TEST_STARTED',
  AGENT_TEST_COMPLETED = 'AGENT_TEST_COMPLETED',
  AGENT_TEST_ERROR = 'AGENT_TEST_ERROR'
}

export enum SystemUpdate {
  ERROR = 'ERROR'
}

// Combined type for all possible updates
export type WebsocketCopilotUpdate = 
  | PieceCommandUpdate
  | AgentCommandUpdate
  | SystemUpdate;

// Type-safe result interface
export type WebsocketCopilotResult<T = any> = {
  type: WebsocketCopilotUpdate;
  data: T;
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

export interface PlannerPromptTemplate {
  system: string;
  context: string;
  request: string;
  defaultGuidelines: string[];
  requirements: string[];
  important: string[];
}


