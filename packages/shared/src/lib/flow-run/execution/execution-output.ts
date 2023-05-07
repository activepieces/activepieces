import {ExecutionState} from './execution-state';

export enum ExecutionOutputStatus {
  FAILED = 'FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RUNNING = "RUNNING",
  SUCCEEDED = 'SUCCEEDED',
  SUSPENDED = 'SUSPENDED',
  TIMEOUT = "TIMEOUT",
}

export interface ExecutionOutput {
  status: ExecutionOutputStatus;
  executionState: ExecutionState;
  duration: number;
  tasks: number;
  errorMessage?: ExecutionError;
}

export interface ExecutionError {
  stepName: string;
  errorMessage: string;
}
