import { ActionType } from "../../flows/actions/action";
import { PauseMetadata } from "./execution-output";

export enum StepOutputStatus {
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  SUCCEEDED = 'SUCCEEDED',
}

export type StepOutput<T extends ActionType = ActionType, O = any> = {
  type: T
  status: StepOutputStatus
  input: unknown
  output?: O
  duration?: number
  errorMessage?: unknown;
  standardOutput?: unknown;
  pauseMetadata?: Omit<PauseMetadata, 'executionState'>
  stopResponse?: unknown
}

type LoopOnItemsOutput = {
  item: unknown
  index: number
  iterations: Record<string, StepOutput>[]
}

export type LoopOnItemsStepOutput = StepOutput<ActionType.LOOP_ON_ITEMS, LoopOnItemsOutput>

type BranchOutput = {
  condition: boolean
}

export type BranchStepOutput = StepOutput<ActionType.BRANCH, BranchOutput>

export type StepOutputForActionType<T extends ActionType, O = unknown> =
  T extends ActionType.BRANCH ? BranchStepOutput :
  T extends ActionType.LOOP_ON_ITEMS ? LoopOnItemsStepOutput :
  StepOutput<T, O>
