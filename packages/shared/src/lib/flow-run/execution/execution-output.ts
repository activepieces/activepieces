import { ActionType } from '../../flows/actions/action';
import {ExecutionState} from './execution-state';
import { StopResponse } from './step-output';

export enum ExecutionOutputStatus {
  FAILED = 'FAILED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  PAUSED = 'PAUSED',
  RUNNING = "RUNNING",
  STOPPED = 'STOPPED',
  SUCCEEDED = 'SUCCEEDED',
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
  tags?: string[];
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
  WEBHOOK = "WEBHOOK"
}

type BasePauseMetadata<T extends PauseType> = {
  type: T;
  resumeStepMetadata: ResumeStepMetadata;
}

export type DelayPauseMetadata = BasePauseMetadata<PauseType.DELAY> & {
  resumeDateTime: string;
}

export type WebhookPauseMetadata =  BasePauseMetadata<PauseType.WEBHOOK> & {
  actions: string[];
}

export type PauseMetadata = DelayPauseMetadata | WebhookPauseMetadata


export type PauseExecutionOutput = BaseExecutionOutput<ExecutionOutputStatus.PAUSED> & {
  pauseMetadata: PauseMetadata
}

export type FinishExecutionOutput = BaseExecutionOutput<
  Exclude<
    ExecutionOutputStatus,
      | ExecutionOutputStatus.PAUSED
      | ExecutionOutputStatus.STOPPED
  >
>

export type StopExecutionOutput = BaseExecutionOutput<ExecutionOutputStatus.STOPPED> & {
  stopResponse?: StopResponse
}

export type ExecutionOutput =
  | FinishExecutionOutput
  | PauseExecutionOutput
  | StopExecutionOutput
