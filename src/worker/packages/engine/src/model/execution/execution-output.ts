import {ExecutionState} from './execution-state';
import {ExecutionError} from './execution-error';

export enum ExecutionOutputStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export class ExecutionOutput {
  status: ExecutionOutputStatus;
  executionState: ExecutionState;
  duration: number;
  errorMessage?: ExecutionError;

  constructor(
    status: ExecutionOutputStatus,
    executionState: ExecutionState,
    duration: number,
    errorMessage?: ExecutionError
  ) {
    this.status = status;
    this.executionState = executionState;
    this.duration = duration;
    this.errorMessage = errorMessage;
  }
}
