import { isNil } from '../../common'
import { ActionType } from '../../flows/actions/action'
import { TriggerType } from '../../flows/triggers/trigger'

export enum StepOutputStatus {
    FAILED = 'FAILED',
    PAUSED = 'PAUSED',
    RUNNING = 'RUNNING',
    STOPPED = 'STOPPED',
    SUCCEEDED = 'SUCCEEDED',
}

type BaseStepOutputParams<T extends ActionType | TriggerType, OUTPUT> = {
    type: T
    status: StepOutputStatus
    input: unknown
    output?: OUTPUT
    duration?: number
    errorMessage?: unknown
}

export class GenericStepOutput<T extends ActionType | TriggerType, OUTPUT> {
    type: T
    status: StepOutputStatus
    input: unknown
    output?: OUTPUT
    duration?: number
    errorMessage?: unknown

    constructor(step: BaseStepOutputParams<T, OUTPUT>) {
        this.type = step.type
        this.status = step.status
        this.input = step.input
        this.output = step.output
        this.duration = step.duration
        this.errorMessage = step.errorMessage
    }

    setOutput(output: OUTPUT): GenericStepOutput<T, OUTPUT> {
        return new GenericStepOutput<T, OUTPUT>({
            ...this,
            output,
        })
    }

    setStatus(status: StepOutputStatus): GenericStepOutput<T, OUTPUT> {
        return new GenericStepOutput<T, OUTPUT>({
            ...this,
            status,
        })
    }

    setErrorMessage(errorMessage: unknown): GenericStepOutput<T, OUTPUT> {
        return new GenericStepOutput<T, OUTPUT>({
            ...this,
            errorMessage,
        })
    }

    static create<T extends ActionType | TriggerType, OUTPUT>({
        input,
        type,
        status,
        output,
    }: {
        input: unknown
        type: T
        status: StepOutputStatus
        output?: OUTPUT
    }): GenericStepOutput<T, OUTPUT> {
        return new GenericStepOutput<T, OUTPUT>({
            input,
            type,
            status,
            output,
        })
    }
}

export type StepOutput =
  | GenericStepOutput<ActionType.LOOP_ON_ITEMS, LoopStepResult>
  | GenericStepOutput<ActionType.ROUTER, unknown>
  | GenericStepOutput<
  | Exclude<ActionType, ActionType.LOOP_ON_ITEMS | ActionType.ROUTER>
  | TriggerType,
  unknown
  >



type RouterStepResult = {
    branches: boolean[]
}

export class RouterStepOutput extends GenericStepOutput<
ActionType.ROUTER,
RouterStepResult
> {
    static init({ input }: { input: unknown }): RouterStepOutput {
        return new RouterStepOutput({
            type: ActionType.ROUTER,
            input,
            status: StepOutputStatus.SUCCEEDED,
        })
    }
}

export type LoopStepResult = {
    item: unknown
    index: number
    iterations: Record<string, StepOutput>[]
}

export class LoopStepOutput extends GenericStepOutput<
ActionType.LOOP_ON_ITEMS,
LoopStepResult
> {
    constructor(
        step: BaseStepOutputParams<ActionType.LOOP_ON_ITEMS, LoopStepResult>,
    ) {
        super(step)
        this.output = step.output ?? {
            item: undefined,
            index: 0,
            iterations: [],
        }
    }

    static init({ input }: { input: unknown }): LoopStepOutput {
        return new LoopStepOutput({
            type: ActionType.LOOP_ON_ITEMS,
            input,
            status: StepOutputStatus.SUCCEEDED,
        })
    }

    hasIteration(iteration: number): boolean {
        return !isNil(this.output?.iterations[iteration])
    }

    setItemAndIndex({
        item,
        index,
    }: {
        item: unknown
        index: number
    }): LoopStepOutput {
        return new LoopStepOutput({
            ...this,
            output: {
                item,
                index,
                iterations: this.output?.iterations ?? [],
            },
        })
    }

    addIteration(): LoopStepOutput {
        return new LoopStepOutput({
            ...this,
            output: {
                item: this.output?.item,
                index: this.output?.index,
                iterations: [...(this.output?.iterations ?? []), {}],
            },
        })
    }
}
