import { Static } from '@sinclair/typebox';
import { FlowStatus } from '../flow';
import { FlowVersion } from '../flow-version';
import { FlowTriggerType } from '../triggers/trigger';
import { _getActionsForCopy } from './copy-action-operations';
export declare enum FlowOperationType {
    LOCK_AND_PUBLISH = "LOCK_AND_PUBLISH",
    CHANGE_STATUS = "CHANGE_STATUS",
    LOCK_FLOW = "LOCK_FLOW",
    CHANGE_FOLDER = "CHANGE_FOLDER",
    CHANGE_NAME = "CHANGE_NAME",
    MOVE_ACTION = "MOVE_ACTION",
    IMPORT_FLOW = "IMPORT_FLOW",
    UPDATE_TRIGGER = "UPDATE_TRIGGER",
    ADD_ACTION = "ADD_ACTION",
    UPDATE_ACTION = "UPDATE_ACTION",
    DELETE_ACTION = "DELETE_ACTION",
    DUPLICATE_ACTION = "DUPLICATE_ACTION",
    USE_AS_DRAFT = "USE_AS_DRAFT",
    DELETE_BRANCH = "DELETE_BRANCH",
    ADD_BRANCH = "ADD_BRANCH",
    DUPLICATE_BRANCH = "DUPLICATE_BRANCH",
    SET_SKIP_ACTION = "SET_SKIP_ACTION",
    UPDATE_METADATA = "UPDATE_METADATA",
    MOVE_BRANCH = "MOVE_BRANCH",
    SAVE_SAMPLE_DATA = "SAVE_SAMPLE_DATA",
    UPDATE_MINUTES_SAVED = "UPDATE_MINUTES_SAVED"
}
export declare const DeleteBranchRequest: import("@sinclair/typebox").TObject<{
    branchIndex: import("@sinclair/typebox").TNumber;
    stepName: import("@sinclair/typebox").TString;
}>;
export declare const AddBranchRequest: import("@sinclair/typebox").TObject<{
    branchIndex: import("@sinclair/typebox").TNumber;
    stepName: import("@sinclair/typebox").TString;
    conditions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        firstValue: import("@sinclair/typebox").TString;
        secondValue: import("@sinclair/typebox").TString;
        caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
    }>, import("@sinclair/typebox").TObject<{
        firstValue: import("@sinclair/typebox").TString;
        secondValue: import("@sinclair/typebox").TString;
        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
    }>, import("@sinclair/typebox").TObject<{
        firstValue: import("@sinclair/typebox").TString;
        secondValue: import("@sinclair/typebox").TString;
        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_AFTER>)[]>>;
    }>, import("@sinclair/typebox").TObject<{
        firstValue: import("@sinclair/typebox").TString;
        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
    }>]>>>>;
    branchName: import("@sinclair/typebox").TString;
}>;
export declare const MoveBranchRequest: import("@sinclair/typebox").TObject<{
    sourceBranchIndex: import("@sinclair/typebox").TNumber;
    targetBranchIndex: import("@sinclair/typebox").TNumber;
    stepName: import("@sinclair/typebox").TString;
}>;
export type MoveBranchRequest = Static<typeof MoveBranchRequest>;
export declare const SkipActionRequest: import("@sinclair/typebox").TObject<{
    names: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    skip: import("@sinclair/typebox").TBoolean;
}>;
export type SkipActionRequest = Static<typeof SkipActionRequest>;
export declare const DuplicateBranchRequest: import("@sinclair/typebox").TObject<{
    branchIndex: import("@sinclair/typebox").TNumber;
    stepName: import("@sinclair/typebox").TString;
}>;
export type DeleteBranchRequest = Static<typeof DeleteBranchRequest>;
export type AddBranchRequest = Static<typeof AddBranchRequest>;
export type DuplicateBranchRequest = Static<typeof DuplicateBranchRequest>;
export declare enum StepLocationRelativeToParent {
    AFTER = "AFTER",
    INSIDE_LOOP = "INSIDE_LOOP",
    INSIDE_BRANCH = "INSIDE_BRANCH"
}
export declare const UseAsDraftRequest: import("@sinclair/typebox").TObject<{
    versionId: import("@sinclair/typebox").TString;
}>;
export type UseAsDraftRequest = Static<typeof UseAsDraftRequest>;
export declare const LockFlowRequest: import("@sinclair/typebox").TObject<{}>;
export type LockFlowRequest = Static<typeof LockFlowRequest>;
export declare const ImportFlowRequest: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<FlowTriggerType.PIECE>;
        settings: import("@sinclair/typebox").TObject<{
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                type: import("@sinclair/typebox").TEnum<typeof import("..").PropertyExecutionType>;
                schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<FlowTriggerType.EMPTY>;
        settings: import("@sinclair/typebox").TAny;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }>]>;
    schemaVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
}>;
export type ImportFlowRequest = Static<typeof ImportFlowRequest>;
export declare const ChangeFolderRequest: import("@sinclair/typebox").TObject<{
    folderId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
}>;
export type ChangeFolderRequest = Static<typeof ChangeFolderRequest>;
export declare const ChangeNameRequest: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
}>;
export type ChangeNameRequest = Static<typeof ChangeNameRequest>;
export declare const DeleteActionRequest: import("@sinclair/typebox").TObject<{
    names: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>;
export type DeleteActionRequest = Static<typeof DeleteActionRequest>;
export declare const UpdateActionRequest: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.CODE>;
    settings: import("@sinclair/typebox").TObject<{
        sourceCode: import("@sinclair/typebox").TObject<{
            packageJson: import("@sinclair/typebox").TString;
            code: import("@sinclair/typebox").TString;
        }>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
            retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
        }>>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.LOOP_ON_ITEMS>;
    settings: import("@sinclair/typebox").TObject<{
        items: import("@sinclair/typebox").TString;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.PIECE>;
    settings: import("@sinclair/typebox").TObject<{
        propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TEnum<typeof import("..").PropertyExecutionType>;
            schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        actionName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
            retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
        }>>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.ROUTER>;
    settings: import("@sinclair/typebox").TObject<{
        branches: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            conditions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_AFTER>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
            }>]>>>;
            branchType: import("@sinclair/typebox").TLiteral<import("../actions/action").BranchExecutionType.CONDITION>;
            branchName: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            branchType: import("@sinclair/typebox").TLiteral<import("../actions/action").BranchExecutionType.FALLBACK>;
            branchName: import("@sinclair/typebox").TString;
        }>]>>;
        executionType: import("@sinclair/typebox").TEnum<typeof import("../actions/action").RouterExecutionType>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>]>;
export type UpdateActionRequest = Static<typeof UpdateActionRequest>;
export declare const DuplicateStepRequest: import("@sinclair/typebox").TObject<{
    stepName: import("@sinclair/typebox").TString;
}>;
export type DuplicateStepRequest = Static<typeof DuplicateStepRequest>;
export declare const MoveActionRequest: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    newParentStep: import("@sinclair/typebox").TString;
    stepLocationRelativeToNewParent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof StepLocationRelativeToParent>>;
    branchIndex: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export type MoveActionRequest = Static<typeof MoveActionRequest>;
export declare const AddActionRequest: import("@sinclair/typebox").TObject<{
    parentStep: import("@sinclair/typebox").TString;
    stepLocationRelativeToParent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof StepLocationRelativeToParent>>;
    branchIndex: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    action: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.CODE>;
        settings: import("@sinclair/typebox").TObject<{
            sourceCode: import("@sinclair/typebox").TObject<{
                packageJson: import("@sinclair/typebox").TString;
                code: import("@sinclair/typebox").TString;
            }>;
            input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
            errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                }>>;
                retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                }>>;
            }>>;
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.LOOP_ON_ITEMS>;
        settings: import("@sinclair/typebox").TObject<{
            items: import("@sinclair/typebox").TString;
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.PIECE>;
        settings: import("@sinclair/typebox").TObject<{
            propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                type: import("@sinclair/typebox").TEnum<typeof import("..").PropertyExecutionType>;
                schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
            }>>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            actionName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
            errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                }>>;
                retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                }>>;
            }>>;
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.ROUTER>;
        settings: import("@sinclair/typebox").TObject<{
            branches: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                conditions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    firstValue: import("@sinclair/typebox").TString;
                    secondValue: import("@sinclair/typebox").TString;
                    caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
                }>, import("@sinclair/typebox").TObject<{
                    firstValue: import("@sinclair/typebox").TString;
                    secondValue: import("@sinclair/typebox").TString;
                    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
                }>, import("@sinclair/typebox").TObject<{
                    firstValue: import("@sinclair/typebox").TString;
                    secondValue: import("@sinclair/typebox").TString;
                    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_AFTER>)[]>>;
                }>, import("@sinclair/typebox").TObject<{
                    firstValue: import("@sinclair/typebox").TString;
                    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
                }>]>>>;
                branchType: import("@sinclair/typebox").TLiteral<import("../actions/action").BranchExecutionType.CONDITION>;
                branchName: import("@sinclair/typebox").TString;
            }>, import("@sinclair/typebox").TObject<{
                branchType: import("@sinclair/typebox").TLiteral<import("../actions/action").BranchExecutionType.FALLBACK>;
                branchName: import("@sinclair/typebox").TString;
            }>]>>;
            executionType: import("@sinclair/typebox").TEnum<typeof import("../actions/action").RouterExecutionType>;
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>]>;
}>;
export type AddActionRequest = Static<typeof AddActionRequest>;
export declare const UpdateTriggerRequest: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowTriggerType.EMPTY>;
    settings: import("@sinclair/typebox").TAny;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowTriggerType.PIECE>;
    settings: import("@sinclair/typebox").TObject<{
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TEnum<typeof import("..").PropertyExecutionType>;
            schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>]>;
export type UpdateTriggerRequest = Static<typeof UpdateTriggerRequest>;
export declare const UpdateFlowStatusRequest: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TEnum<typeof FlowStatus>;
}>;
export type UpdateFlowStatusRequest = Static<typeof UpdateFlowStatusRequest>;
export declare const ChangePublishedVersionIdRequest: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof FlowStatus>>;
}>;
export type ChangePublishedVersionIdRequest = Static<typeof ChangePublishedVersionIdRequest>;
export declare const UpdateMetadataRequest: import("@sinclair/typebox").TObject<{
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
}>;
export type UpdateMetadataRequest = Static<typeof UpdateMetadataRequest>;
export declare const UpdateMinutesSavedRequest: import("@sinclair/typebox").TObject<{
    timeSavedPerRun: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
}>;
export type UpdateMinutesSavedRequest = Static<typeof UpdateMinutesSavedRequest>;
export declare const FlowOperationRequest: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.MOVE_ACTION>;
    request: import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        newParentStep: import("@sinclair/typebox").TString;
        stepLocationRelativeToNewParent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof StepLocationRelativeToParent>>;
        branchIndex: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.CHANGE_STATUS>;
    request: import("@sinclair/typebox").TObject<{
        status: import("@sinclair/typebox").TEnum<typeof FlowStatus>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.LOCK_AND_PUBLISH>;
    request: import("@sinclair/typebox").TObject<{
        status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof FlowStatus>>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.USE_AS_DRAFT>;
    request: import("@sinclair/typebox").TObject<{
        versionId: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.LOCK_FLOW>;
    request: import("@sinclair/typebox").TObject<{}>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.IMPORT_FLOW>;
    request: import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<FlowTriggerType.PIECE>;
            settings: import("@sinclair/typebox").TObject<{
                sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                }>>;
                propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                    type: import("@sinclair/typebox").TEnum<typeof import("..").PropertyExecutionType>;
                    schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
                }>>;
                customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                pieceName: import("@sinclair/typebox").TString;
                pieceVersion: import("@sinclair/typebox").TString;
                triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
            }>;
            name: import("@sinclair/typebox").TString;
            valid: import("@sinclair/typebox").TBoolean;
            displayName: import("@sinclair/typebox").TString;
            nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<FlowTriggerType.EMPTY>;
            settings: import("@sinclair/typebox").TAny;
            name: import("@sinclair/typebox").TString;
            valid: import("@sinclair/typebox").TBoolean;
            displayName: import("@sinclair/typebox").TString;
            nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>]>;
        schemaVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.CHANGE_NAME>;
    request: import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.DELETE_ACTION>;
    request: import("@sinclair/typebox").TObject<{
        names: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.UPDATE_ACTION>;
    request: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.CODE>;
        settings: import("@sinclair/typebox").TObject<{
            sourceCode: import("@sinclair/typebox").TObject<{
                packageJson: import("@sinclair/typebox").TString;
                code: import("@sinclair/typebox").TString;
            }>;
            input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
            errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                }>>;
                retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                }>>;
            }>>;
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.LOOP_ON_ITEMS>;
        settings: import("@sinclair/typebox").TObject<{
            items: import("@sinclair/typebox").TString;
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.PIECE>;
        settings: import("@sinclair/typebox").TObject<{
            propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                type: import("@sinclair/typebox").TEnum<typeof import("..").PropertyExecutionType>;
                schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
            }>>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            actionName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
            errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                }>>;
                retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                }>>;
            }>>;
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.ROUTER>;
        settings: import("@sinclair/typebox").TObject<{
            branches: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                conditions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    firstValue: import("@sinclair/typebox").TString;
                    secondValue: import("@sinclair/typebox").TString;
                    caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
                }>, import("@sinclair/typebox").TObject<{
                    firstValue: import("@sinclair/typebox").TString;
                    secondValue: import("@sinclair/typebox").TString;
                    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
                }>, import("@sinclair/typebox").TObject<{
                    firstValue: import("@sinclair/typebox").TString;
                    secondValue: import("@sinclair/typebox").TString;
                    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_AFTER>)[]>>;
                }>, import("@sinclair/typebox").TObject<{
                    firstValue: import("@sinclair/typebox").TString;
                    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
                }>]>>>;
                branchType: import("@sinclair/typebox").TLiteral<import("../actions/action").BranchExecutionType.CONDITION>;
                branchName: import("@sinclair/typebox").TString;
            }>, import("@sinclair/typebox").TObject<{
                branchType: import("@sinclair/typebox").TLiteral<import("../actions/action").BranchExecutionType.FALLBACK>;
                branchName: import("@sinclair/typebox").TString;
            }>]>>;
            executionType: import("@sinclair/typebox").TEnum<typeof import("../actions/action").RouterExecutionType>;
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>]>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.ADD_ACTION>;
    request: import("@sinclair/typebox").TObject<{
        parentStep: import("@sinclair/typebox").TString;
        stepLocationRelativeToParent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof StepLocationRelativeToParent>>;
        branchIndex: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        action: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.CODE>;
            settings: import("@sinclair/typebox").TObject<{
                sourceCode: import("@sinclair/typebox").TObject<{
                    packageJson: import("@sinclair/typebox").TString;
                    code: import("@sinclair/typebox").TString;
                }>;
                input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
                errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                        value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    }>>;
                    retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                        value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    }>>;
                }>>;
                sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                }>>;
                customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>;
            name: import("@sinclair/typebox").TString;
            valid: import("@sinclair/typebox").TBoolean;
            displayName: import("@sinclair/typebox").TString;
            skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.LOOP_ON_ITEMS>;
            settings: import("@sinclair/typebox").TObject<{
                items: import("@sinclair/typebox").TString;
                sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                }>>;
                customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>;
            name: import("@sinclair/typebox").TString;
            valid: import("@sinclair/typebox").TBoolean;
            displayName: import("@sinclair/typebox").TString;
            skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.PIECE>;
            settings: import("@sinclair/typebox").TObject<{
                propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                    type: import("@sinclair/typebox").TEnum<typeof import("..").PropertyExecutionType>;
                    schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
                }>>;
                pieceName: import("@sinclair/typebox").TString;
                pieceVersion: import("@sinclair/typebox").TString;
                actionName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
                errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                        value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    }>>;
                    retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                        value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    }>>;
                }>>;
                sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                }>>;
                customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>;
            name: import("@sinclair/typebox").TString;
            valid: import("@sinclair/typebox").TBoolean;
            displayName: import("@sinclair/typebox").TString;
            skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<import("../actions/action").FlowActionType.ROUTER>;
            settings: import("@sinclair/typebox").TObject<{
                branches: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    conditions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                        firstValue: import("@sinclair/typebox").TString;
                        secondValue: import("@sinclair/typebox").TString;
                        caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
                    }>, import("@sinclair/typebox").TObject<{
                        firstValue: import("@sinclair/typebox").TString;
                        secondValue: import("@sinclair/typebox").TString;
                        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
                    }>, import("@sinclair/typebox").TObject<{
                        firstValue: import("@sinclair/typebox").TString;
                        secondValue: import("@sinclair/typebox").TString;
                        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_AFTER>)[]>>;
                    }>, import("@sinclair/typebox").TObject<{
                        firstValue: import("@sinclair/typebox").TString;
                        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
                    }>]>>>;
                    branchType: import("@sinclair/typebox").TLiteral<import("../actions/action").BranchExecutionType.CONDITION>;
                    branchName: import("@sinclair/typebox").TString;
                }>, import("@sinclair/typebox").TObject<{
                    branchType: import("@sinclair/typebox").TLiteral<import("../actions/action").BranchExecutionType.FALLBACK>;
                    branchName: import("@sinclair/typebox").TString;
                }>]>>;
                executionType: import("@sinclair/typebox").TEnum<typeof import("../actions/action").RouterExecutionType>;
                sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                }>>;
                customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>;
            name: import("@sinclair/typebox").TString;
            valid: import("@sinclair/typebox").TBoolean;
            displayName: import("@sinclair/typebox").TString;
            skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>]>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.UPDATE_TRIGGER>;
    request: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<FlowTriggerType.EMPTY>;
        settings: import("@sinclair/typebox").TAny;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<FlowTriggerType.PIECE>;
        settings: import("@sinclair/typebox").TObject<{
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                type: import("@sinclair/typebox").TEnum<typeof import("..").PropertyExecutionType>;
                schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }>]>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.CHANGE_FOLDER>;
    request: import("@sinclair/typebox").TObject<{
        folderId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.DUPLICATE_ACTION>;
    request: import("@sinclair/typebox").TObject<{
        stepName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.DELETE_BRANCH>;
    request: import("@sinclair/typebox").TObject<{
        branchIndex: import("@sinclair/typebox").TNumber;
        stepName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.ADD_BRANCH>;
    request: import("@sinclair/typebox").TObject<{
        branchIndex: import("@sinclair/typebox").TNumber;
        stepName: import("@sinclair/typebox").TString;
        conditions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            secondValue: import("@sinclair/typebox").TString;
            caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
        }>, import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            secondValue: import("@sinclair/typebox").TString;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
        }>, import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            secondValue: import("@sinclair/typebox").TString;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DATE_IS_AFTER>)[]>>;
        }>, import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<import("../actions/action").BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
        }>]>>>>;
        branchName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.DUPLICATE_BRANCH>;
    request: import("@sinclair/typebox").TObject<{
        branchIndex: import("@sinclair/typebox").TNumber;
        stepName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.SET_SKIP_ACTION>;
    request: import("@sinclair/typebox").TObject<{
        names: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        skip: import("@sinclair/typebox").TBoolean;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.UPDATE_METADATA>;
    request: import("@sinclair/typebox").TObject<{
        metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
            [x: string]: unknown;
        }>>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.MOVE_BRANCH>;
    request: import("@sinclair/typebox").TObject<{
        sourceBranchIndex: import("@sinclair/typebox").TNumber;
        targetBranchIndex: import("@sinclair/typebox").TNumber;
        stepName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.SAVE_SAMPLE_DATA>;
    request: import("@sinclair/typebox").TObject<{
        stepName: import("@sinclair/typebox").TString;
        payload: import("@sinclair/typebox").TUnknown;
        type: import("@sinclair/typebox").TEnum<typeof import("../sample-data").SampleDataFileType>;
        dataType: import("@sinclair/typebox").TEnum<typeof import("../sample-data").SampleDataDataType>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowOperationType.UPDATE_MINUTES_SAVED>;
    request: import("@sinclair/typebox").TObject<{
        timeSavedPerRun: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    }>;
}>]>;
export type FlowOperationRequest = Static<typeof FlowOperationRequest>;
export declare const flowOperations: {
    getActionsForCopy: typeof _getActionsForCopy;
    getOperationsForPaste: (actions: import("../actions/action").FlowAction[], flowVersion: FlowVersion, pastingDetails: import("./paste-operations").PasteLocation) => ({
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
            status: FlowStatus;
        };
    } | {
        type: FlowOperationType.LOCK_AND_PUBLISH;
        request: {
            status?: FlowStatus;
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
                type: FlowTriggerType.EMPTY;
                name: string;
                displayName: string;
                settings: any;
                valid: boolean;
            } | {
                nextAction?: any;
                type: FlowTriggerType.PIECE;
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
            type: FlowTriggerType.EMPTY;
            name: string;
            displayName: string;
            settings: any;
            valid: boolean;
        } | {
            nextAction?: any;
            type: FlowTriggerType.PIECE;
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
            type: import("../sample-data").SampleDataFileType;
            dataType: import("../sample-data").SampleDataDataType;
            stepName: string;
            payload: unknown;
        };
    } | {
        type: FlowOperationType.UPDATE_MINUTES_SAVED;
        request: {
            timeSavedPerRun?: number;
        };
    })[];
    apply(flowVersion: FlowVersion, operation: FlowOperationRequest): FlowVersion;
};
