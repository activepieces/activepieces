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
  TEST_ERROR = 'TEST_ERROR',
  TEST_STOPPED = 'TEST_STOPPED',
  TEST_SUMMARY = 'TEST_SUMMARY',
  TEST_STATE = 'TEST_STATE',
}

export type WebsocketCopilotResult = {
  type: WebsocketCopilotUpdate.PIECES_FOUND;
  data: PiecesFoundData;
} | {
  type: WebsocketCopilotUpdate.PLAN_GENERATED;
  data: PlanGeneratedData;
} | {
  type: WebsocketCopilotUpdate.STEP_CREATED;
  data: StepCreatedData;
} | {
  type: WebsocketCopilotUpdate.SCENARIO_COMPLETED;
  data: ScenarioCompletedData;
} | {
  type: WebsocketCopilotUpdate.TEST_ERROR;
  data: TestErrorData;
} | {
  type: WebsocketCopilotUpdate.TEST_STATE;
  data: TestStateData;
}
