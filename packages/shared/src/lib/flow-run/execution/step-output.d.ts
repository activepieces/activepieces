import { FlowActionType } from '../../flows/actions/action';
import { FlowTriggerType } from '../../flows/triggers/trigger';
export declare enum StepOutputStatus {
    FAILED = "FAILED",
    PAUSED = "PAUSED",
    RUNNING = "RUNNING",
    STOPPED = "STOPPED",
    SUCCEEDED = "SUCCEEDED"
}
type BaseStepOutputParams<T extends FlowActionType | FlowTriggerType, OUTPUT> = {
    type: T;
    status: StepOutputStatus;
    input: unknown;
    output?: OUTPUT;
    duration?: number;
    errorMessage?: unknown;
};
export declare class GenericStepOutput<T extends FlowActionType | FlowTriggerType, OUTPUT> {
    type: T;
    status: StepOutputStatus;
    input: unknown;
    output?: OUTPUT;
    duration?: number;
    errorMessage?: unknown;
    constructor(step: BaseStepOutputParams<T, OUTPUT>);
    setOutput(output: OUTPUT): GenericStepOutput<T, OUTPUT>;
    setStatus(status: StepOutputStatus): GenericStepOutput<T, OUTPUT>;
    setErrorMessage(errorMessage: unknown): GenericStepOutput<T, OUTPUT>;
    setDuration(duration: number): GenericStepOutput<T, OUTPUT>;
    static create<T extends FlowActionType | FlowTriggerType, OUTPUT>({ input, type, status, output, }: {
        input: unknown;
        type: T;
        status: StepOutputStatus;
        output?: OUTPUT;
    }): GenericStepOutput<T, OUTPUT>;
}
export type StepOutput = GenericStepOutput<FlowActionType.LOOP_ON_ITEMS, LoopStepResult> | GenericStepOutput<FlowActionType.ROUTER, unknown> | GenericStepOutput<Exclude<FlowActionType, FlowActionType.LOOP_ON_ITEMS | FlowActionType.ROUTER> | FlowTriggerType, unknown>;
type BranchResult = {
    branchName: string;
    branchIndex: number;
    evaluation: boolean;
};
type RouterStepResult = {
    branches: BranchResult[];
};
export declare class RouterStepOutput extends GenericStepOutput<FlowActionType.ROUTER, RouterStepResult> {
    static init({ input }: {
        input: unknown;
    }): RouterStepOutput;
}
export type LoopStepResult = {
    item: unknown;
    index: number;
    iterations: Record<string, StepOutput>[];
};
export declare class LoopStepOutput extends GenericStepOutput<FlowActionType.LOOP_ON_ITEMS, LoopStepResult> {
    constructor(step: BaseStepOutputParams<FlowActionType.LOOP_ON_ITEMS, LoopStepResult>);
    static init({ input }: {
        input: unknown;
    }): LoopStepOutput;
    setIterations(iterations: Record<string, StepOutput>[]): LoopStepOutput;
    hasIteration(iteration: number): boolean;
    setItemAndIndex({ item, index, }: {
        item: unknown;
        index: number;
    }): LoopStepOutput;
    addIteration(): LoopStepOutput;
}
export {};
