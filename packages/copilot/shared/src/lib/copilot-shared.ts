export enum WebsocketEventTypes {
  RUN_TESTS = 'RUN_TESTS',
  GET_STATE = 'GET_STATE',
  UPDATE_RESULTS = 'UPDATE_RESULTS',
  RESPONSE_GET_STATE = 'RESPONSE_GET_STATE'
}

export interface RunTestsParams {
  scenarioTitle: string;
  relevanceThreshold?: number;
  customPrompt?: string;
  stepPrompt?: string;
}

export type State = {
  scenarios: {
    title: string;
    prompt: string;
    status: 'running' | 'stopped' | 'idle';
  }[];
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
  PIECES_FOUND = 'PIECES_FOUND',
  PLAN_GENERATED = 'PLAN_GENERATED',
  STEP_CREATED = 'STEP_CREATED',
  SCENARIO_COMPLETED = 'SCENARIO_COMPLETED',
  ERROR = 'ERROR'
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


