import { FlowAction } from '../actions/action';
import { FlowVersion } from '../flow-version';
import { FlowOperationType, StepLocationRelativeToParent } from './index';
export type InsideBranchPasteLocation = {
    branchIndex: number;
    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
    parentStepName: string;
};
export type OutsideBranchPasteLocation = {
    parentStepName: string;
    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER | StepLocationRelativeToParent.INSIDE_LOOP;
};
export type PasteLocation = InsideBranchPasteLocation | OutsideBranchPasteLocation;
export declare const _getOperationsForPaste: (actions: FlowAction[], flowVersion: FlowVersion, pastingDetails: PasteLocation) => ({
    type: FlowOperationType.MOVE_ACTION;
    request: {
        branchIndex?: number;
        stepLocationRelativeToNewParent?: StepLocationRelativeToParent;
        name: string;
        newParentStep: string;
    };
} | {
    type: FlowOperationType.CHANGE_STATUS;
    request: {
        status: import("..").FlowStatus;
    };
} | {
    type: FlowOperationType.LOCK_AND_PUBLISH;
    request: {
        status?: import("..").FlowStatus;
    };
} | {
    type: FlowOperationType.USE_AS_DRAFT;
    request: {
        versionId: string;
    };
} | {
    type: FlowOperationType.LOCK_FLOW;
    request: {};
} | {
    type: FlowOperationType.IMPORT_FLOW;
    request: {
        schemaVersion?: string;
        displayName: string;
        trigger: {
            nextAction?: any;
            type: import("../triggers/trigger").FlowTriggerType.EMPTY;
            name: string;
            displayName: string;
            settings: any;
            valid: boolean;
        } | {
            nextAction?: any;
            type: import("../triggers/trigger").FlowTriggerType.PIECE;
            name: string;
            displayName: string;
            settings: {
                sampleData?: {
                    sampleDataFileId?: string;
                    sampleDataInputFileId?: string;
                    lastTestDate?: string;
                };
                customLogoUrl?: string;
                triggerName?: string;
                pieceName: string;
                pieceVersion: string;
                input: {
                    [x: string]: any;
                };
                propertySettings: {
                    [x: string]: {
                        schema?: any;
                        type: import("..").PropertyExecutionType;
                    };
                };
            };
            valid: boolean;
        };
    };
} | {
    type: FlowOperationType.CHANGE_NAME;
    request: {
        displayName: string;
    };
} | {
    type: FlowOperationType.DELETE_ACTION;
    request: {
        names: string[];
    };
} | {
    type: FlowOperationType.UPDATE_ACTION;
    request: {
        skip?: boolean;
        type: import("../actions/action").FlowActionType.ROUTER;
        name: string;
        displayName: string;
        settings: {
            sampleData?: {
                sampleDataFileId?: string;
                sampleDataInputFileId?: string;
                lastTestDate?: string;
            };
            customLogoUrl?: string;
            branches: ({
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
                branchType: import("../actions/action").BranchExecutionType.CONDITION;
                branchName: string;
            } | {
                branchType: import("../actions/action").BranchExecutionType.FALLBACK;
                branchName: string;
            })[];
            executionType: import("../actions/action").RouterExecutionType;
        };
        valid: boolean;
    } | {
        skip?: boolean;
        type: import("../actions/action").FlowActionType.LOOP_ON_ITEMS;
        name: string;
        displayName: string;
        settings: {
            sampleData?: {
                sampleDataFileId?: string;
                sampleDataInputFileId?: string;
                lastTestDate?: string;
            };
            customLogoUrl?: string;
            items: string;
        };
        valid: boolean;
    } | {
        skip?: boolean;
        type: import("../actions/action").FlowActionType.PIECE;
        name: string;
        displayName: string;
        settings: {
            actionName?: string;
            sampleData?: {
                sampleDataFileId?: string;
                sampleDataInputFileId?: string;
                lastTestDate?: string;
            };
            customLogoUrl?: string;
            errorHandlingOptions?: {
                continueOnFailure?: {
                    value?: boolean;
                };
                retryOnFailure?: {
                    value?: boolean;
                };
            };
            pieceName: string;
            pieceVersion: string;
            input: {
                [x: string]: unknown;
            };
            propertySettings: {
                [x: string]: {
                    schema?: any;
                    type: import("..").PropertyExecutionType;
                };
            };
        };
        valid: boolean;
    } | {
        skip?: boolean;
        type: import("../actions/action").FlowActionType.CODE;
        name: string;
        displayName: string;
        settings: {
            sampleData?: {
                sampleDataFileId?: string;
                sampleDataInputFileId?: string;
                lastTestDate?: string;
            };
            customLogoUrl?: string;
            errorHandlingOptions?: {
                continueOnFailure?: {
                    value?: boolean;
                };
                retryOnFailure?: {
                    value?: boolean;
                };
            };
            input: {
                [x: string]: any;
            };
            sourceCode: {
                code: string;
                packageJson: string;
            };
        };
        valid: boolean;
    };
} | {
    type: FlowOperationType.ADD_ACTION;
    request: {
        stepLocationRelativeToParent?: StepLocationRelativeToParent;
        branchIndex?: number;
        parentStep: string;
        action: {
            skip?: boolean;
            type: import("../actions/action").FlowActionType.ROUTER;
            name: string;
            displayName: string;
            settings: {
                sampleData?: {
                    sampleDataFileId?: string;
                    sampleDataInputFileId?: string;
                    lastTestDate?: string;
                };
                customLogoUrl?: string;
                branches: ({
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
                    branchType: import("../actions/action").BranchExecutionType.CONDITION;
                    branchName: string;
                } | {
                    branchType: import("../actions/action").BranchExecutionType.FALLBACK;
                    branchName: string;
                })[];
                executionType: import("../actions/action").RouterExecutionType;
            };
            valid: boolean;
        } | {
            skip?: boolean;
            type: import("../actions/action").FlowActionType.LOOP_ON_ITEMS;
            name: string;
            displayName: string;
            settings: {
                sampleData?: {
                    sampleDataFileId?: string;
                    sampleDataInputFileId?: string;
                    lastTestDate?: string;
                };
                customLogoUrl?: string;
                items: string;
            };
            valid: boolean;
        } | {
            skip?: boolean;
            type: import("../actions/action").FlowActionType.PIECE;
            name: string;
            displayName: string;
            settings: {
                actionName?: string;
                sampleData?: {
                    sampleDataFileId?: string;
                    sampleDataInputFileId?: string;
                    lastTestDate?: string;
                };
                customLogoUrl?: string;
                errorHandlingOptions?: {
                    continueOnFailure?: {
                        value?: boolean;
                    };
                    retryOnFailure?: {
                        value?: boolean;
                    };
                };
                pieceName: string;
                pieceVersion: string;
                input: {
                    [x: string]: unknown;
                };
                propertySettings: {
                    [x: string]: {
                        schema?: any;
                        type: import("..").PropertyExecutionType;
                    };
                };
            };
            valid: boolean;
        } | {
            skip?: boolean;
            type: import("../actions/action").FlowActionType.CODE;
            name: string;
            displayName: string;
            settings: {
                sampleData?: {
                    sampleDataFileId?: string;
                    sampleDataInputFileId?: string;
                    lastTestDate?: string;
                };
                customLogoUrl?: string;
                errorHandlingOptions?: {
                    continueOnFailure?: {
                        value?: boolean;
                    };
                    retryOnFailure?: {
                        value?: boolean;
                    };
                };
                input: {
                    [x: string]: any;
                };
                sourceCode: {
                    code: string;
                    packageJson: string;
                };
            };
            valid: boolean;
        };
    };
} | {
    type: FlowOperationType.UPDATE_TRIGGER;
    request: {
        nextAction?: any;
        type: import("../triggers/trigger").FlowTriggerType.EMPTY;
        name: string;
        displayName: string;
        settings: any;
        valid: boolean;
    } | {
        nextAction?: any;
        type: import("../triggers/trigger").FlowTriggerType.PIECE;
        name: string;
        displayName: string;
        settings: {
            sampleData?: {
                sampleDataFileId?: string;
                sampleDataInputFileId?: string;
                lastTestDate?: string;
            };
            customLogoUrl?: string;
            triggerName?: string;
            pieceName: string;
            pieceVersion: string;
            input: {
                [x: string]: any;
            };
            propertySettings: {
                [x: string]: {
                    schema?: any;
                    type: import("..").PropertyExecutionType;
                };
            };
        };
        valid: boolean;
    };
} | {
    type: FlowOperationType.CHANGE_FOLDER;
    request: {
        folderId?: string;
    };
} | {
    type: FlowOperationType.DUPLICATE_ACTION;
    request: {
        stepName: string;
    };
} | {
    type: FlowOperationType.DELETE_BRANCH;
    request: {
        stepName: string;
        branchIndex: number;
    };
} | {
    type: FlowOperationType.ADD_BRANCH;
    request: {
        conditions?: ({
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
        stepName: string;
        branchName: string;
        branchIndex: number;
    };
} | {
    type: FlowOperationType.DUPLICATE_BRANCH;
    request: {
        stepName: string;
        branchIndex: number;
    };
} | {
    type: FlowOperationType.SET_SKIP_ACTION;
    request: {
        skip: boolean;
        names: string[];
    };
} | {
    type: FlowOperationType.UPDATE_METADATA;
    request: {
        metadata?: {
            [x: string]: unknown;
        };
    };
} | {
    type: FlowOperationType.MOVE_BRANCH;
    request: {
        stepName: string;
        sourceBranchIndex: number;
        targetBranchIndex: number;
    };
} | {
    type: FlowOperationType.SAVE_SAMPLE_DATA;
    request: {
        type: import("..").SampleDataFileType;
        dataType: import("..").SampleDataDataType;
        stepName: string;
        payload: unknown;
    };
} | {
    type: FlowOperationType.UPDATE_MINUTES_SAVED;
    request: {
        timeSavedPerRun?: number;
    };
})[];
