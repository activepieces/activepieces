import { StepOutput } from './step-output';

export const MAX_LOG_SIZE = 2048 * 1024;

export type ExecutionState = {
  steps: Record<string, StepOutput>;
}
