import { PauseMetadata } from "./execution-output";

export enum StepOutputStatus {
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
}

export class StepOutput<T = any>{
  duration?: number;
  input?: unknown;
  output?: T
  errorMessage?: unknown;
  standardOutput?: unknown;
  status?: StepOutputStatus;
  pauseMetadata?: Omit<PauseMetadata, 'executionState'>
}

export class LoopOnItemsStepOutput extends StepOutput<{
  item: unknown;
  index: number;
  iterations: Record<string, StepOutput>[];
}> {

}

export class BranchStepOutput extends StepOutput<{
  condition: boolean;
}> {

}
