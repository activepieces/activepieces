import { ActionType } from '../../flows/actions/action';
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

type BaseResumeStepMetadata<T extends ActionType> = {
  type: T
  name: string
}

export type LoopResumeStepMetadata = BaseResumeStepMetadata<ActionType.LOOP_ON_ITEMS> & {
  iteration: number
  childResumeStepMetadata: ResumeStepMetadata
}

export type BranchResumeStepMetadata = BaseResumeStepMetadata<ActionType.BRANCH> & {
  conditionEvaluation: boolean
  childResumeStepMetadata: ResumeStepMetadata
}

type NormalResumeStepMetadata = BaseResumeStepMetadata<Exclude<
  ActionType,
  ActionType.BRANCH | ActionType.LOOP_ON_ITEMS
>>

export type ResumeStepMetadata =
  | NormalResumeStepMetadata
  | BranchResumeStepMetadata
  | LoopResumeStepMetadata


export enum PauseType {
  DELAY = 'DELAY',
}

type BasePauseMetadata<T extends PauseType> = {
  type: T;
  resumeStepMetadata: ResumeStepMetadata;
  executionState: ExecutionState;
}

export type DelayPauseMetadata = BasePauseMetadata<PauseType.DELAY> & {
  resumeDateTime: string;
}

export type PauseMetadata = DelayPauseMetadata


export type PauseExecutionOutput = BaseExecutionOutput<ExecutionOutputStatus.PAUSED> & {
  pauseMetadata: Omit<PauseMetadata, 'executionState'>
}

export type FinishExecutionOutput = BaseExecutionOutput<Exclude<ExecutionOutputStatus, ExecutionOutputStatus.PAUSED>>

export type ExecutionOutput = FinishExecutionOutput | PauseExecutionOutput
