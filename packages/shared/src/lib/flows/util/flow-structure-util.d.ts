import { BranchCondition, BranchExecutionType, FlowAction, FlowActionType, LoopOnItemsAction, RouterAction } from '../actions/action';
import { FlowVersion } from '../flow-version';
import { FlowTrigger, FlowTriggerType } from '../triggers/trigger';
export declare const AI_PIECE_NAME = "@activepieces/piece-ai";
export type Step = FlowAction | FlowTrigger;
type StepWithIndex = Step & {
    dfsIndex: number;
};
declare function isAction(type: FlowActionType | FlowTriggerType | undefined): type is FlowActionType;
declare function isTrigger(type: FlowActionType | FlowTriggerType | undefined): type is FlowTriggerType;
declare function getActionOrThrow(name: string, flowRoot: Step): FlowAction;
declare function getTriggerOrThrow(name: string, flowRoot: Step): FlowTrigger;
declare function getStep(name: string, flowRoot: Step): Step | undefined;
declare function getStepOrThrow(name: string, flowRoot: Step): Step;
declare function transferStep<T extends Step>(step: Step, transferFunction: (step: T) => T): Step;
declare function transferFlow<T extends Step>(flowVersion: FlowVersion, transferFunction: (step: T) => T): FlowVersion;
declare function getAllSteps(step: Step): Step[];
declare function findPathToStep(trigger: FlowTrigger, targetStepName: string): StepWithIndex[];
declare function getAllChildSteps(action: LoopOnItemsAction | RouterAction): Step[];
declare function isChildOf(parent: Step, childStepName: string): boolean;
declare function getAllNextActionsWithoutChildren(start: Step): Step[];
declare function extractAgentIds(flowVersion: FlowVersion): string[];
declare function isAgentPiece(action: Step): boolean;
declare function extractConnectionIds(flowVersion: FlowVersion): string[];
export declare const flowStructureUtil: {
    isTrigger: typeof isTrigger;
    isAction: typeof isAction;
    getAllSteps: typeof getAllSteps;
    transferStep: typeof transferStep;
    transferFlow: typeof transferFlow;
    getStepOrThrow: typeof getStepOrThrow;
    getActionOrThrow: typeof getActionOrThrow;
    getTriggerOrThrow: typeof getTriggerOrThrow;
    getStep: typeof getStep;
    createBranch: (branchName: string, conditions: BranchCondition[][] | undefined) => {
        conditions: ({
            caseSensitive?: boolean;
            operator?: import("../actions/action").BranchOperator.TEXT_CONTAINS | import("../actions/action").BranchOperator.TEXT_DOES_NOT_CONTAIN | import("../actions/action").BranchOperator.TEXT_EXACTLY_MATCHES | import("../actions/action").BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH | import("../actions/action").BranchOperator.TEXT_STARTS_WITH | import("../actions/action").BranchOperator.TEXT_DOES_NOT_START_WITH | import("../actions/action").BranchOperator.TEXT_ENDS_WITH | import("../actions/action").BranchOperator.TEXT_DOES_NOT_END_WITH | import("../actions/action").BranchOperator.LIST_CONTAINS | import("../actions/action").BranchOperator.LIST_DOES_NOT_CONTAIN;
            firstValue: string;
            secondValue: string;
        } | {
            operator?: import("../actions/action").BranchOperator.NUMBER_IS_GREATER_THAN | import("../actions/action").BranchOperator.NUMBER_IS_LESS_THAN | import("../actions/action").BranchOperator.NUMBER_IS_EQUAL_TO;
            firstValue: string;
            secondValue: string;
        } | {
            operator?: import("../actions/action").BranchOperator.DATE_IS_BEFORE | import("../actions/action").BranchOperator.DATE_IS_EQUAL | import("../actions/action").BranchOperator.DATE_IS_AFTER;
            firstValue: string;
            secondValue: string;
        } | {
            operator?: import("../actions/action").BranchOperator.BOOLEAN_IS_TRUE | import("../actions/action").BranchOperator.BOOLEAN_IS_FALSE | import("../actions/action").BranchOperator.LIST_IS_EMPTY | import("../actions/action").BranchOperator.LIST_IS_NOT_EMPTY | import("../actions/action").BranchOperator.EXISTS | import("../actions/action").BranchOperator.DOES_NOT_EXIST;
            firstValue: string;
        })[][];
        branchType: BranchExecutionType;
        branchName: string;
    };
    findPathToStep: typeof findPathToStep;
    isChildOf: typeof isChildOf;
    findUnusedName: (source: FlowTrigger | string[]) => string;
    findUnusedNames: (source: FlowTrigger | string[], count?: number) => any[];
    getAllNextActionsWithoutChildren: typeof getAllNextActionsWithoutChildren;
    getAllChildSteps: typeof getAllChildSteps;
    extractConnectionIds: typeof extractConnectionIds;
    isAgentPiece: typeof isAgentPiece;
    extractAgentIds: typeof extractAgentIds;
};
export {};
