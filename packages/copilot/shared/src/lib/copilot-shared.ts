export function copilotShared(): string {
  return 'copilot-shared';
}

export enum TestResultType {
  PIECES_FOUND = 'PIECES_FOUND',
  PLAN_GENERATED = 'PLAN_GENERATED',
  STEP_CREATED = 'STEP_CREATED',
  SCENARIO_COMPLETED = 'SCENARIO_COMPLETED',
  TEST_ERROR = 'TEST_ERROR',
  TEST_STOPPED = 'TEST_STOPPED',
  TEST_SUMMARY = 'TEST_SUMMARY',
  TEST_STATE = 'TEST_STATE'
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

export interface TestResult {
  type: TestResultType;
  data: PiecesFoundData | PlanGeneratedData | StepCreatedData | ScenarioCompletedData | TestErrorData | TestStateData;
}
