
export enum WebsocketEventTypes {
  RUN_TESTS = 'RUN_TESTS',
  STOP_TESTS = 'STOP_TESTS',
  PIECES_FOUND = 'PIECES_FOUND',
  PLAN_GENERATED = 'PLAN_GENERATED',
  STEP_CREATED = 'STEP_CREATED',
  SCENARIO_COMPLETED = 'SCENARIO_COMPLETED',
  TEST_ERROR = 'TEST_ERROR',
  TEST_STOPPED = 'TEST_STOPPED',
  TEST_SUMMARY = 'TEST_SUMMARY',
  TEST_STATE = 'TEST_STATE',
  GET_STATE = 'GET_STATE',
  RESPONSE_GET_STATE = 'RESPONSE_GET_STATE'
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

export type WebsocketCopilotResult = {
  type: WebsocketEventTypes.PIECES_FOUND;
  data: PiecesFoundData;
} | {
  type: WebsocketEventTypes.PLAN_GENERATED;
  data: PlanGeneratedData;
} | {
  type: WebsocketEventTypes.STEP_CREATED;
  data: StepCreatedData;
} | {
  type: WebsocketEventTypes.SCENARIO_COMPLETED;
  data: ScenarioCompletedData;
} | {
  type: WebsocketEventTypes.TEST_ERROR;
  data: TestErrorData;
} | {
  type: WebsocketEventTypes.TEST_STATE;
  data: TestStateData;
} | {
  type: WebsocketEventTypes.RESPONSE_GET_STATE;
  data: State;
}
