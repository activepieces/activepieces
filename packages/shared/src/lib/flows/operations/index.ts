import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../../common'
import { BranchCondition, CodeActionSchema, LoopOnItemsActionSchema, PieceActionSchema, RouterActionSchema } from '../actions/action'
import { FlowStatus } from '../flow'
import { FlowVersion, FlowVersionState } from '../flow-version'
import { EmptyTrigger, PieceTrigger, Trigger } from '../triggers/trigger'
import { flowPieceUtil } from '../util/flow-piece-util'
import { flowStructureUtil } from '../util/flow-structure-util'
import { _addAction } from './add-action'
import { _addBranch } from './add-branch'
import { _deleteAction } from './delete-action'
import { _deleteBranch } from './delete-branch'
import { _duplicateBranch, _duplicateStep } from './duplicate-step'
import { _importFlow } from './import-flow'
import { flowMigrations } from './migrations'
import { _moveAction } from './move-action'
import { _updateAction } from './update-action'
import { _updateTrigger } from './update-trigger'

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
}

export const DeleteBranchRequest = Type.Object({
    branchIndex: Type.Number(),
    stepName: Type.String(),
})
export const AddBranchRequest = Type.Object({
    branchIndex: Type.Number(),
    stepName: Type.String(),
    conditions: Type.Optional(Type.Array(Type.Array(BranchCondition))),
    branchName: Type.String(),
})

export const DuplicateBranchRequest = Type.Object({
    branchIndex: Type.Number(),
    stepName: Type.String(),
})
export type DeleteBranchRequest = Static<typeof DeleteBranchRequest>
export type AddBranchRequest = Static<typeof AddBranchRequest>
export type DuplicateBranchRequest = Static<typeof DuplicateBranchRequest>

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
    trigger: Trigger,
    schemaVersion: Nullable(Type.String()),
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

export const UpdateActionRequest = Type.Union([
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
    stepLocationRelativeToParent: Type.Optional(
        Type.Enum(StepLocationRelativeToParent),
    ),
    branchIndex: Type.Optional(Type.Number()),
    action: UpdateActionRequest,
})
export type AddActionRequest = Static<typeof AddActionRequest>

export const UpdateTriggerRequest = Type.Union([EmptyTrigger, PieceTrigger])
export type UpdateTriggerRequest = Static<typeof UpdateTriggerRequest>

export const UpdateFlowStatusRequest = Type.Object({
    status: Type.Enum(FlowStatus),
})
export type UpdateFlowStatusRequest = Static<typeof UpdateFlowStatusRequest>

export const ChangePublishedVersionIdRequest = Type.Object({})
export type ChangePublishedVersionIdRequest = Static<
    typeof ChangePublishedVersionIdRequest
>

export const FlowOperationRequest = Type.Union([
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
            request: UpdateActionRequest,
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
])

export type FlowOperationRequest = Static<typeof FlowOperationRequest>

export const flowOperations = {
    apply(flowVersion: FlowVersion, operation: FlowOperationRequest): FlowVersion {
        let clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
        switch (operation.type) {
            case FlowOperationType.MOVE_ACTION: {
                const operations: FlowOperationRequest[] = _moveAction(clonedVersion, operation.request)
                operations.forEach((operation) => {
                    clonedVersion = flowOperations.apply(clonedVersion, operation)
                })
                clonedVersion = flowPieceUtil.makeFlowAutoUpgradable(clonedVersion)
                break
            }
            case FlowOperationType.CHANGE_NAME:
                clonedVersion.displayName = operation.request.displayName
                break
            case FlowOperationType.DUPLICATE_BRANCH: {
                const operations = _duplicateBranch(operation.request.stepName, operation.request.branchIndex, clonedVersion)
                operations.forEach((operation) => {
                    clonedVersion = flowOperations.apply(clonedVersion, operation)
                })
                break
            }
            case FlowOperationType.DUPLICATE_ACTION: {
                const operations = _duplicateStep(operation.request.stepName, clonedVersion)
                operations.forEach((operation) => {
                    clonedVersion = flowOperations.apply(clonedVersion, operation)
                })
                break
            }
            case FlowOperationType.LOCK_FLOW:
                clonedVersion.state = FlowVersionState.LOCKED
                break
            case FlowOperationType.ADD_ACTION: {
                clonedVersion = _addAction(clonedVersion, operation.request)
                clonedVersion = flowPieceUtil.makeFlowAutoUpgradable(clonedVersion)
                break
            }
            case FlowOperationType.DELETE_ACTION: {
                clonedVersion = _deleteAction(clonedVersion, operation.request)
                clonedVersion = flowPieceUtil.makeFlowAutoUpgradable(clonedVersion)
                break
            }
            case FlowOperationType.UPDATE_TRIGGER: {
                clonedVersion = _updateTrigger(clonedVersion, operation.request)
                clonedVersion = flowPieceUtil.makeFlowAutoUpgradable(clonedVersion)
                break
            }
            case FlowOperationType.ADD_BRANCH: {
                clonedVersion = _addBranch(clonedVersion, operation.request)
                clonedVersion = flowPieceUtil.makeFlowAutoUpgradable(clonedVersion)
                break
            }
            case FlowOperationType.DELETE_BRANCH: {
                clonedVersion = _deleteBranch(clonedVersion, operation.request)
                clonedVersion = flowPieceUtil.makeFlowAutoUpgradable(clonedVersion)
                break
            }
            case FlowOperationType.UPDATE_ACTION: {
                clonedVersion = _updateAction(clonedVersion, operation.request)
                clonedVersion = flowPieceUtil.makeFlowAutoUpgradable(clonedVersion)
                break
            }
            case FlowOperationType.IMPORT_FLOW: {
                const migratedFlow = flowMigrations.apply({
                    ...clonedVersion,
                    trigger: operation.request.trigger,
                    displayName: operation.request.displayName,
                    schemaVersion: operation.request.schemaVersion,
                })
                const operations = _importFlow(clonedVersion, migratedFlow)
                operations.forEach((operation) => {
                    clonedVersion = flowOperations.apply(clonedVersion, operation)
                })
                break
            }
            default:
                break
        }
        clonedVersion.valid = flowStructureUtil.getAllSteps(clonedVersion.trigger).every((step) => step.valid)
        return clonedVersion
    },
}