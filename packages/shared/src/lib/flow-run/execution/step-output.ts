import { ActionType } from "../../flows/actions/action";
import { TriggerType } from "../../flows/triggers/trigger";

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

export type StepOutput<T extends ActionType | TriggerType = ActionType | TriggerType, O = any> = {
  type: T
  status: StepOutputStatus
  input: unknown
  output?: O
  duration?: number
  errorMessage?: unknown;
  standardOutput?: unknown;
}

export type LoopOnItemsStepOutput = StepOutput<ActionType.LOOP_ON_ITEMS, {
  item: unknown
  index: number
  iterations: Record<string, StepOutput>[],
}
> & {
  addIteration: (params: { item: unknown, index: number }) => LoopOnItemsStepOutput;
}

export const StepOutput = {
  create({ type, input }: { type: ActionType, input: unknown }): StepOutput {
    return {
      type,
      input,
      status: StepOutputStatus.SUCCEEDED,
    }
  },
  createLoopOutput({ input }: { input: unknown }): LoopOnItemsStepOutput {
    return {
      ...LoopOnItemsStepOutput,
      type: ActionType.LOOP_ON_ITEMS,
      status: StepOutputStatus.SUCCEEDED,
      input,
      output: {
        item: undefined,
        index: 0,
        iterations: []
      },
    }
  },
}

export const LoopOnItemsStepOutput = {
  type: ActionType.LOOP_ON_ITEMS,
  status: StepOutputStatus.SUCCEEDED,
  input: undefined,
  output: {
    item: undefined,
    index: undefined,
    iterations: []
  },
  addIteration({ item, index }: { item: unknown, index: number }): LoopOnItemsStepOutput {
    return {
      ...this,
      type: ActionType.LOOP_ON_ITEMS,
      output: {
        item,
        index,
        iterations: [...this.output.iterations, {}]
      }
    }
  }
}

export type BranchStepOutput = StepOutput<ActionType.BRANCH, {
  condition: boolean
}>
