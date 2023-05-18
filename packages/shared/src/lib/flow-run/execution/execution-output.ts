import {ExecutionState} from './execution-state';

export enum ExecutionOutputStatus {
  FAILED = 'FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RUNNING = "RUNNING",
  SUCCEEDED = 'SUCCEEDED',
  PAUSED = 'PAUSED',
  TIMEOUT = 'TIMEOUT',
}

export type ExecutionError = {
  stepName: string;
  errorMessage: string;
}

type BaseExecutionOutput<T extends ExecutionOutputStatus> = {
  status: T;
  executionState: ExecutionState;
  duration: number;
  tasks: number;
  errorMessage?: ExecutionError;
}


export enum PauseType {
  DELAY = 'DELAY',
}

type BasePauseMetadata<T extends PauseType> = {
  type: T;
  resumeStepName: string;
  executionState: ExecutionState;
}

export type DelayPauseMetadata = BasePauseMetadata<PauseType.DELAY> & {
  resumeDateTime: string;
}

export type PauseMetadata = DelayPauseMetadata


export type PauseExecutionOutput = BaseExecutionOutput<ExecutionOutputStatus.PAUSED> & {
  pauseMetadata: PauseMetadata
}

export type FinishExecutionOutput = BaseExecutionOutput<Exclude<ExecutionOutputStatus, ExecutionOutputStatus.PAUSED>>

export type ExecutionOutput = FinishExecutionOutput | PauseExecutionOutput
