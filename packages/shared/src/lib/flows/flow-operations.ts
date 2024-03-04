import { Nullable } from '../common'
import {
    CodeActionSchema, BranchActionSchema, LoopOnItemsActionSchema, PieceActionSchema, Action,
} from './actions/action'
import { FlowStatus } from './flow'
import { EmptyTrigger, PieceTrigger } from './triggers/trigger'
import { Static, Type } from '@sinclair/typebox'


export enum FlowOperationType {
    LOCK_AND_PUBLISH = 'LOCK_AND_PUBLISH',
    CHANGE_STATUS = 'CHANGE_STATUS',
    LOCK_FLOW = 'LOCK_FLOW',
    CHANGE_FOLDER = 'CHANGE_FOLDER',
    CHANGE_NAME = 'CHANGE_NAME',
    MOVE_ACTION = 'MOVE_ACTION',
    IMPORT_FLOW = 'IMPORT_FLOW',
    UPDATE_TRIGGER = 'UPDATE_TRIGGER',
    ADD_ACTION = 'ADD_ACTION',
    UPDATE_ACTION = 'UPDATE_ACTION',
    DELETE_ACTION = 'DELETE_ACTION',
    DUPLICATE_ACTION = 'DUPLICATE_ACTION',
    USE_AS_DRAFT = 'USE_AS_DRAFT',
}

export enum StepLocationRelativeToParent {
    INSIDE_TRUE_BRANCH = 'INSIDE_TRUE_BRANCH',
    INSIDE_FALSE_BRANCH = 'INSIDE_FALSE_BRANCH',
    AFTER = 'AFTER',
    INSIDE_LOOP = 'INSIDE_LOOP',
}

const optionalNextAction = Type.Object({ nextAction: Type.Optional(Action) })

export const UseAsDraftRequest = Type.Object({
    versionId: Type.String(),
})
export type UseAsDraftRequest = Static<typeof UseAsDraftRequest>

export const LockFlowRequest = Type.Object({})

export type LockFlowRequest = Static<typeof LockFlowRequest>

export const ImportFlowRequest = Type.Object({
    displayName: Type.String({}),
    trigger: Type.Union([Type.Composite([PieceTrigger, optionalNextAction]), Type.Composite([EmptyTrigger, optionalNextAction])]),
})

export type ImportFlowRequest = Static<typeof ImportFlowRequest>

export const ChangeFolderRequest = Type.Object({
    folderId: Nullable(Type.String({})),
})



export type ChangeFolderRequest = Static<typeof ChangeFolderRequest>

export const ChangeNameRequest = Type.Object({
    displayName: Type.String({}),
})

export type ChangeNameRequest = Static<typeof ChangeNameRequest>

export const DeleteActionRequest = Type.Object({
    name: Type.String(),
})

export type DeleteActionRequest = Static<typeof DeleteActionRequest>

export const UpdateActionRequest = Type.Union([CodeActionSchema, LoopOnItemsActionSchema, PieceActionSchema, BranchActionSchema])
export type UpdateActionRequest = Static<typeof UpdateActionRequest>

export const DuplicateStepRequest = Type.Object({
    stepName: Type.String(),
})

export type DuplicateStepRequest = Static<typeof DuplicateStepRequest>

export const MoveActionRequest = Type.Object({
    name: Type.String(),
    newParentStep: Type.String(),
    stepLocationRelativeToNewParent: Type.Optional(Type.Enum(StepLocationRelativeToParent)),
})
export type MoveActionRequest = Static<typeof MoveActionRequest>

export const AddActionRequest = Type.Object({
    parentStep: Type.String(),
    stepLocationRelativeToParent: Type.Optional(Type.Enum(StepLocationRelativeToParent)),
    action: UpdateActionRequest,
})
export type AddActionRequest = Static<typeof AddActionRequest>

export const UpdateTriggerRequest = Type.Union([EmptyTrigger, PieceTrigger])
export type UpdateTriggerRequest = Static<typeof UpdateTriggerRequest>

export const UpdateFlowStatusRequest =  Type.Object({
    status: Type.Enum(FlowStatus),
})
export type UpdateFlowStatusRequest = Static<typeof UpdateFlowStatusRequest>

export const ChangePublishedVersionIdRequest = Type.Object({})
export type ChangePublishedVersionIdRequest = Static<typeof ChangePublishedVersionIdRequest>

export const FlowOperationRequest = Type.Union([
    Type.Object({
        type: Type.Literal(FlowOperationType.MOVE_ACTION),
        request: MoveActionRequest,
    }, {
        title: 'Move Action',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.CHANGE_STATUS),
        request: UpdateFlowStatusRequest,
    }, {
        title: 'Change Status',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.LOCK_AND_PUBLISH),
        request: ChangePublishedVersionIdRequest,
    }, {
        title: 'Lock and Publish',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.USE_AS_DRAFT),
        request: UseAsDraftRequest,
    }, {
        title: 'Copy as Draft',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.LOCK_FLOW),
        request: LockFlowRequest,
    }, {
        title: 'Lock Flow',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.IMPORT_FLOW),
        request: ImportFlowRequest,
    }, {
        title: 'Import Flow',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.CHANGE_NAME),
        request: ChangeNameRequest,
    }, {
        title: 'Change Name',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.DELETE_ACTION),
        request: DeleteActionRequest,
    }, {
        title: 'Delete Action',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.UPDATE_ACTION),
        request: UpdateActionRequest,
    }, {
        title: 'Update Action',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.ADD_ACTION),
        request: AddActionRequest,
    }, {
        title: 'Add Action',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.UPDATE_TRIGGER),
        request: UpdateTriggerRequest,
    }, {
        title: 'Update Trigger',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.CHANGE_FOLDER),
        request: ChangeFolderRequest,
    }, {
        title: 'Change Folder',
    }),
    Type.Object({
        type: Type.Literal(FlowOperationType.DUPLICATE_ACTION),
        request: DuplicateStepRequest,
    }, {
        title: 'Duplicate Action',
    }),
])


export type FlowOperationRequest = Static<typeof FlowOperationRequest>