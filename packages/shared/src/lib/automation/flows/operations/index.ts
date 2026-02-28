import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../../../core/common'
import { DiscriminatedUnion } from '../../../core/common/base-model'
import { Metadata } from '../../../core/common/metadata'
import { BranchCondition, CodeActionSchema, LoopOnItemsActionSchema, PieceActionSchema, RouterActionSchema } from '../actions/action'
import { FlowStatus } from '../flow'
import { FlowGraph } from '../graph/flow-graph'
import { Note } from '../note'
import { SaveSampleDataRequest } from '../sample-data'
import { UpdateEmptyTrigger, UpdatePieceTrigger } from '../triggers/trigger'

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
    DELETE_BRANCH = 'DELETE_BRANCH',
    ADD_BRANCH = 'ADD_BRANCH',
    DUPLICATE_BRANCH = 'DUPLICATE_BRANCH',
    SET_SKIP_ACTION = 'SET_SKIP_ACTION',
    UPDATE_METADATA = 'UPDATE_METADATA',
    MOVE_BRANCH = 'MOVE_BRANCH',
    UPDATE_BRANCH = 'UPDATE_BRANCH',
    SAVE_SAMPLE_DATA = 'SAVE_SAMPLE_DATA',
    UPDATE_MINUTES_SAVED = 'UPDATE_MINUTES_SAVED',
    UPDATE_OWNER = 'UPDATE_OWNER',
    UPDATE_NOTE = 'UPDATE_NOTE',
    DELETE_NOTE = 'DELETE_NOTE',
    ADD_NOTE = 'ADD_NOTE',
}

export const DeleteBranchRequest = Type.Object({
    branchIndex: Type.Number(),
    stepName: Type.String(),
})

export const UpdateNoteRequest = Type.Omit(Note, [ 'createdAt', 'updatedAt'])
export const DeleteNoteRequest = Type.Object({
    id: Type.String(),
})
export const AddNoteRequest = Type.Omit(Note, ['createdAt', 'updatedAt', 'ownerId'])

export const AddBranchRequest = Type.Object({
    branchIndex: Type.Number(),
    stepName: Type.String(),
    conditions: Type.Optional(Type.Array(Type.Array(BranchCondition))),
    branchName: Type.String(),
})
export const MoveBranchRequest = Type.Object({
    sourceBranchIndex: Type.Number(),
    targetBranchIndex: Type.Number(),
    stepName: Type.String(),
})
export type MoveBranchRequest = Static<typeof MoveBranchRequest>

export const UpdateBranchRequest = Type.Object({
    branchIndex: Type.Number(),
    stepName: Type.String(),
    conditions: Type.Optional(Type.Array(Type.Array(BranchCondition))),
    branchName: Type.Optional(Type.String()),
})
export type UpdateBranchRequest = Static<typeof UpdateBranchRequest>

export const SkipActionRequest = Type.Object({
    names: Type.Array(Type.String()),
    skip: Type.Boolean(),
})

export type SkipActionRequest = Static<typeof SkipActionRequest>

export const DuplicateBranchRequest = Type.Object({
    branchIndex: Type.Number(),
    stepName: Type.String(),
})
export type DeleteBranchRequest = Static<typeof DeleteBranchRequest>
export type AddBranchRequest = Static<typeof AddBranchRequest>
export type DuplicateBranchRequest = Static<typeof DuplicateBranchRequest>
export type UpdateNoteRequest = Static<typeof UpdateNoteRequest>
export type DeleteNoteRequest = Static<typeof DeleteNoteRequest>
export type AddNoteRequest = Static<typeof AddNoteRequest>

export enum StepLocationRelativeToParent {
    AFTER = 'AFTER',
    INSIDE_LOOP = 'INSIDE_LOOP',
    INSIDE_BRANCH = 'INSIDE_BRANCH',
}

export const UseAsDraftRequest = Type.Object({
    versionId: Type.String(),
})
export type UseAsDraftRequest = Static<typeof UseAsDraftRequest>

export const LockFlowRequest = Type.Object({})

export type LockFlowRequest = Static<typeof LockFlowRequest>

export const ImportFlowRequest = Type.Object({
    displayName: Type.String({}),
    graph: Type.Unsafe<FlowGraph>(Type.Unknown()),
    schemaVersion: Nullable(Type.String()),
    notes: Nullable(Type.Array(Note)),
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
    names: Type.Array(Type.String()),
})

export type DeleteActionRequest = Static<typeof DeleteActionRequest>

export const UpdateActionRequest = DiscriminatedUnion('kind', [
    CodeActionSchema,
    LoopOnItemsActionSchema,
    PieceActionSchema,
    RouterActionSchema,
])

export type UpdateActionRequest = Static<typeof UpdateActionRequest>

export const DuplicateStepRequest = Type.Object({
    stepName: Type.String(),
})

export type DuplicateStepRequest = Static<typeof DuplicateStepRequest>

export const MoveActionRequest = Type.Object({
    name: Type.String(),
    newParentStep: Type.String(),
    stepLocationRelativeToNewParent: Type.Optional(
        Type.Enum(StepLocationRelativeToParent),
    ),
    branchIndex: Type.Optional(Type.Number()),
})
export type MoveActionRequest = Static<typeof MoveActionRequest>

export const AddActionRequest = Type.Object({
    parentStep: Type.String(),
    id: Type.String(),
    stepLocationRelativeToParent: Type.Optional(
        Type.Enum(StepLocationRelativeToParent),
    ),
    branchIndex: Type.Optional(Type.Number()),
    action: UpdateActionRequest,
})
export type AddActionRequest = Static<typeof AddActionRequest>

export const UpdateTriggerRequest = DiscriminatedUnion('kind', [UpdateEmptyTrigger, UpdatePieceTrigger])
export type UpdateTriggerRequest = Static<typeof UpdateTriggerRequest>

export const UpdateFlowStatusRequest = Type.Object({
    status: Type.Enum(FlowStatus),
})
export type UpdateFlowStatusRequest = Static<typeof UpdateFlowStatusRequest>

export const ChangePublishedVersionIdRequest = Type.Object({
    status: Type.Optional(Type.Enum(FlowStatus)),
})
export type ChangePublishedVersionIdRequest = Static<
    typeof ChangePublishedVersionIdRequest
>

export const UpdateMetadataRequest = Type.Object({
    metadata: Nullable(Metadata),
})
export type UpdateMetadataRequest = Static<typeof UpdateMetadataRequest>

export const UpdateMinutesSavedRequest = Type.Object({
    timeSavedPerRun: Nullable(Type.Number()),
})
export type UpdateMinutesSavedRequest = Static<typeof UpdateMinutesSavedRequest>

export const UpdateOwnerRequest = Type.Object({
    ownerId: Type.String(),
})
export type UpdateOwnerRequest = Static<typeof UpdateOwnerRequest>
export const FlowOperationRequest = DiscriminatedUnion('type', [
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.MOVE_ACTION),
            request: MoveActionRequest,
        },
        {
            title: 'Move Action',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.CHANGE_STATUS),
            request: UpdateFlowStatusRequest,
        },
        {
            title: 'Change Status',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.LOCK_AND_PUBLISH),
            request: ChangePublishedVersionIdRequest,
        },
        {
            title: 'Lock and Publish',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.USE_AS_DRAFT),
            request: UseAsDraftRequest,
        },
        {
            title: 'Copy as Draft',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.LOCK_FLOW),
            request: LockFlowRequest,
        },
        {
            title: 'Lock Flow',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.IMPORT_FLOW),
            request: ImportFlowRequest,
        },
        {
            title: 'Import Flow',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.CHANGE_NAME),
            request: ChangeNameRequest,
        },
        {
            title: 'Change Name',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.DELETE_ACTION),
            request: DeleteActionRequest,
        },
        {
            title: 'Delete Action',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.UPDATE_ACTION),
            request: Type.Object({
                id: Type.String(),
                action: UpdateActionRequest,
            }),
        },
        {
            title: 'Update Action',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.ADD_ACTION),
            request: AddActionRequest,
        },
        {
            title: 'Add Action',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.UPDATE_TRIGGER),
            request: UpdateTriggerRequest,
        },
        {
            title: 'Update Trigger',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.CHANGE_FOLDER),
            request: ChangeFolderRequest,
        },
        {
            title: 'Change Folder',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.DUPLICATE_ACTION),
            request: DuplicateStepRequest,
        },
        {
            title: 'Duplicate Action',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.DELETE_BRANCH),
            request: DeleteBranchRequest,
        },
        {
            title: 'Delete Branch',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.ADD_BRANCH),
            request: AddBranchRequest,
        },
        {
            title: 'Add Branch',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.DUPLICATE_BRANCH),
            request: DuplicateBranchRequest,
        },
        {
            title: 'Duplicate Branch',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.SET_SKIP_ACTION),
            request: SkipActionRequest,
        },
        {
            title: 'Skip Action',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.UPDATE_METADATA),
            request: UpdateMetadataRequest,
        },
        {
            title: 'Update Metadata',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.MOVE_BRANCH),
            request: MoveBranchRequest,
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.UPDATE_BRANCH),
            request: UpdateBranchRequest,
        },
        {
            title: 'Update Branch',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.SAVE_SAMPLE_DATA),
            request: SaveSampleDataRequest,
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.UPDATE_MINUTES_SAVED),
            request: UpdateMinutesSavedRequest,
        },
        {
            title: 'Update Minutes Saved',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.UPDATE_OWNER),
            request: UpdateOwnerRequest,
        },
        {
            title: 'Update Owner',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.UPDATE_NOTE),
            request: UpdateNoteRequest,
        },
        {
            title: 'Update Note',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.DELETE_NOTE),
            request: DeleteNoteRequest,
        },
        {
            title: 'Delete Note',
        },
    ),
    Type.Object(
        {
            type: Type.Literal(FlowOperationType.ADD_NOTE),
            request: AddNoteRequest,
        },
        {
            title: 'Add Note',
        },
    ),

])



export type FlowOperationRequest = Static<typeof FlowOperationRequest>

export { flowOperations } from './apply-operations'
export { actionOperations, actionUtils } from './action-operations'
export { branchOperations } from './branch-operations'
export { triggerOperations } from './trigger-operations'
export { noteOperations } from './note-operations'
export { compositeOperations } from './composite-operations'
export type { PasteLocation, InsideBranchPasteLocation, OutsideBranchPasteLocation } from './composite-operations'
