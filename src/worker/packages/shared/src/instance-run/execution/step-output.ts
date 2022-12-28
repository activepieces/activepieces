export enum StepOutputStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export class StepOutput{
  duration?: number;
  input?: unknown;
  output?: unknown;
  errorMessage?: unknown;
  status?: StepOutputStatus;
}

export class LoopOnItemsStepOutput extends StepOutput {
  override output:
    | {
        current_item: any;
        current_iteration: number;
        iterations: Record<string, StepOutput>[];
      };
}
