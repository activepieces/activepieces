import {ExecutionState} from './execution-state';

export enum ExecutionOutputStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  RUNNING = "RUNNING",
  TIMEOUT = "TIMEOUT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export interface ExecutionOutput {
  status: ExecutionOutputStatus;
  executionState: ExecutionState;
  duration: number;
  errorMessage?: ExecutionError;
}

export interface ExecutionError {
  stepName: string;
  errorMessage: string;
}
