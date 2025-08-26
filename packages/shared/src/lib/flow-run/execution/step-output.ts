import { isNil } from '../../common'
import { FlowActionType } from '../../flows/actions/action'
import { FlowTriggerType } from '../../flows/triggers/trigger'

export enum StepOutputStatus {
    FAILED = 'FAILED',
    PAUSED = 'PAUSED',
    RUNNING = 'RUNNING',
    STOPPED = 'STOPPED',
    SUCCEEDED = 'SUCCEEDED',
}

type BaseStepOutputParams<T extends FlowActionType | FlowTriggerType, OUTPUT> = {
    type: T
    status: StepOutputStatus
    input: unknown
    output?: OUTPUT
    duration?: number
    errorMessage?: unknown
}

export class GenericStepOutput<T extends FlowActionType | FlowTriggerType, OUTPUT> {
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

    setDuration(duration: number): GenericStepOutput<T, OUTPUT> {
        return new GenericStepOutput<T, OUTPUT>({
            ...this,
            duration,
        })
    }

    static create<T extends FlowActionType | FlowTriggerType, OUTPUT>({
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
  | GenericStepOutput<FlowActionType.LOOP_ON_ITEMS, LoopStepResult>
  | GenericStepOutput<FlowActionType.ROUTER, unknown>
  | GenericStepOutput<
  | Exclude<FlowActionType, FlowActionType.LOOP_ON_ITEMS | FlowActionType.ROUTER>
  | FlowTriggerType,
  unknown
  >

type BranchResult = {
    branchName: string
    branchIndex: number
    evaluation: boolean
}

type RouterStepResult = {
    branches: BranchResult[]
}

export class RouterStepOutput extends GenericStepOutput<
FlowActionType.ROUTER,
RouterStepResult
> {
    static init({ input }: { input: unknown }): RouterStepOutput {
        return new RouterStepOutput({
            type: FlowActionType.ROUTER,
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
FlowActionType.LOOP_ON_ITEMS,
LoopStepResult
> {
    constructor(
        step: BaseStepOutputParams<FlowActionType.LOOP_ON_ITEMS, LoopStepResult>,
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
            type: FlowActionType.LOOP_ON_ITEMS,
            input,
            status: StepOutputStatus.SUCCEEDED,
        })
    }

    setIterations(iterations: Record<string, StepOutput>[]): LoopStepOutput {
        return new LoopStepOutput({
            ...this,
            output: {
                ...this.output,
                iterations,
            },
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
