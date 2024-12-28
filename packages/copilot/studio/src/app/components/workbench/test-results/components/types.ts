export interface PiecesFoundData {
  relevantPieces: Array<{
    pieceName: string;
    content: string;
    logoUrl?: string;
  }>;
  timestamp: string;
}

export interface PlanGeneratedData {
  plan: {
    name: string;
    description: string;
    steps: Array<{
      type: string;
      pieceName: string;
      actionOrTriggerName?: string;
      condition?: string;
    }>;
  };
  timestamp: string;
}

export interface StepCreatedData {
  step: {
    name: string;
    type: string;
    piece?: {
      pieceName: string;
      actionName?: string;
      triggerName?: string;
    };
    input?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface ScenarioCompletedData {
  output: unknown;
  timestamp: string;
}

export interface TestErrorData {
  error: string;
  timestamp: string;
}

export interface TestStateData {
  message?: string;
  timestamp: string;
} 