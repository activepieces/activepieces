export enum StepOutputStatus {
  RUNNING = "RUNNING",
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export class StepOutput{
  duration?: number;
  input?: unknown;
  output?: any;
  errorMessage?: unknown;
  standardOutput?: unknown;
  status?: StepOutputStatus;
}

export class LoopOnItemsStepOutput extends StepOutput {
  override output!: {
    current_item: any;
    current_iteration: number;
    iterations: Record<string, StepOutput>[];
  };
}

export class BranchStepOutput extends StepOutput {
  override output!: {
    condition: boolean;
  };
}
