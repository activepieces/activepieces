import { ActionType } from "../../flows/actions/action";

export enum StepOutputStatus {
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  SUCCEEDED = 'SUCCEEDED',
}

export type StopResponse = {
  status?: number
  body?: unknown
  headers?: Record<string, string>
}

export type StepOutput<T extends ActionType = ActionType, O = any> = {
  type: T
  status: StepOutputStatus
  input: unknown
  output?: O
  duration?: number
  errorMessage?: unknown;
  standardOutput?: unknown;
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
