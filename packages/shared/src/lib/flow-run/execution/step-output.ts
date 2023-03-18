export enum StepOutputStatus {
  RUNNING = "RUNNING",
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export class StepOutput<T = any>{
  duration?: number;
  input?: unknown;
  output?: T
  errorMessage?: unknown;
  standardOutput?: unknown;
  status?: StepOutputStatus;
}

export class LoopOnItemsStepOutput extends StepOutput<{
  current_item: unknown;
  current_iteration: number;
  iterations: Record<string, StepOutput>[];
}> {

}

export class BranchStepOutput extends StepOutput<{
  condition: boolean;
}> {

}
