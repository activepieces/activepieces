import { z } from 'zod'
import { Nullable } from '../../../core/common'
import { Metadata } from '../../../core/common/metadata'
import { BranchCondition, CodeActionSchema, CodeActionSettings, FlowActionType, LoopOnItemsActionSchema, LoopOnItemsActionSettings, PieceActionSchema, PieceActionSettings, RouterActionSchema, RouterActionSettings } from '../actions/action'
import { FlowStatus } from '../flow'
import { FlowVersion, FlowVersionState } from '../flow-version'
import { Note } from '../note'
import { SampleDataSetting, SaveSampleDataRequest } from '../sample-data'
import { EmptyTrigger, FlowTrigger, FlowTriggerType, PieceTrigger, PieceTriggerSettings } from '../triggers/trigger'
import { flowPieceUtil } from '../util/flow-piece-util'
import { flowStructureUtil } from '../util/flow-structure-util'
import { _addAction } from './add-action'
import { _addBranch } from './add-branch'
import { _getActionsForCopy } from './copy-action-operations'
import { _deleteAction } from './delete-action'
import { _deleteBranch } from './delete-branch'
import { _duplicateBranch, _duplicateStep } from './duplicate-step'
import { _importFlow } from './import-flow'
import { _moveAction } from './move-action'
import { _moveBranch } from './move-branch'
import { notesOperations } from './notes-operations'
import { _getOperationsForPaste } from './paste-operations'
import { _skipAction } from './skip-action'
import { _updateAction } from './update-action'
import { _updateSampleDataInfo } from './update-sample-data-info'
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
    SET_SKIP_ACTION = 'SET_SKIP_ACTION',
    UPDATE_METADATA = 'UPDATE_METADATA',
    MOVE_BRANCH = 'MOVE_BRANCH',
    SAVE_SAMPLE_DATA = 'SAVE_SAMPLE_DATA',
    UPDATE_MINUTES_SAVED = 'UPDATE_MINUTES_SAVED',
    UPDATE_OWNER = 'UPDATE_OWNER',
    UPDATE_NOTE = 'UPDATE_NOTE',
    DELETE_NOTE = 'DELETE_NOTE',
    ADD_NOTE = 'ADD_NOTE',
    UPDATE_SAMPLE_DATA_INFO = 'UPDATE_SAMPLE_DATA_INFO',
}

export const DeleteBranchRequest = z.object({
    branchIndex: z.number(),
    stepName: z.string(),
})

export const UpdateNoteRequest = Note.omit({ createdAt: true, updatedAt: true })
export const DeleteNoteRequest = z.object({
    id: z.string(),
})
export const AddNoteRequest = Note.omit({ createdAt: true, updatedAt: true, ownerId: true })

export const AddBranchRequest = z.object({
    branchIndex: z.number(),
    stepName: z.string(),
    conditions: z.array(z.array(BranchCondition)).optional(),
    branchName: z.string(),
})
export const MoveBranchRequest = z.object({
    sourceBranchIndex: z.number(),
    targetBranchIndex: z.number(),
    stepName: z.string(),
})
export type MoveBranchRequest = z.infer<typeof MoveBranchRequest>

export const SkipActionRequest = z.object({
    names: z.array(z.string()),
    skip: z.boolean(),
})

export type SkipActionRequest = z.infer<typeof SkipActionRequest>

export const UpdateSampleDataInfoRequest = z.object({
    stepName: z.string(),
    sampleDataSettings: Nullable(SampleDataSetting.omit({ lastTestDate: true })),
})
export type UpdateSampleDataInfoRequest = z.infer<typeof UpdateSampleDataInfoRequest>


export const DuplicateBranchRequest = z.object({
    branchIndex: z.number(),
    stepName: z.string(),
})
export type DeleteBranchRequest = z.infer<typeof DeleteBranchRequest>
export type AddBranchRequest = z.infer<typeof AddBranchRequest>
export type DuplicateBranchRequest = z.infer<typeof DuplicateBranchRequest>
export type UpdateNoteRequest = z.infer<typeof UpdateNoteRequest>
export type DeleteNoteRequest = z.infer<typeof DeleteNoteRequest>
export type AddNoteRequest = z.infer<typeof AddNoteRequest>

export enum StepLocationRelativeToParent {
    AFTER = 'AFTER',
    INSIDE_LOOP = 'INSIDE_LOOP',
    INSIDE_BRANCH = 'INSIDE_BRANCH',
}

export const UseAsDraftRequest = z.object({
    versionId: z.string(),
})
export type UseAsDraftRequest = z.infer<typeof UseAsDraftRequest>

export const LockFlowRequest = z.object({})

export type LockFlowRequest = z.infer<typeof LockFlowRequest>

export const ImportFlowRequest = z.object({
    displayName: z.string(),
    trigger: FlowTrigger,
    schemaVersion: Nullable(z.string()),
    notes: Nullable(z.array(Note)),
})

export type ImportFlowRequest = z.infer<typeof ImportFlowRequest>

export const ChangeFolderRequest = z.object({
    folderId: Nullable(z.string()),
})

export type ChangeFolderRequest = z.infer<typeof ChangeFolderRequest>

export const ChangeNameRequest = z.object({
    displayName: z.string(),
})

export type ChangeNameRequest = z.infer<typeof ChangeNameRequest>


export const DeleteActionRequest = z.object({
    names: z.array(z.string()),
})

export type DeleteActionRequest = z.infer<typeof DeleteActionRequest>

export const UpdateActionRequest = z.union([
    CodeActionSchema.omit({ lastUpdatedDate: true, settings: true }).and(z.object({ settings: CodeActionSettings.omit({ sampleData: true }) })),
    LoopOnItemsActionSchema.omit({ lastUpdatedDate: true, settings: true }).and(z.object({ settings: LoopOnItemsActionSettings.omit({ sampleData: true }) })),
    PieceActionSchema.omit({ lastUpdatedDate: true, settings: true }).and(z.object({ settings: PieceActionSettings.omit({ sampleData: true }) })),
    RouterActionSchema.omit({ lastUpdatedDate: true, settings: true }).and(z.object({ settings: RouterActionSettings.omit({ sampleData: true }) })),
])



export type UpdateActionRequest = z.infer<typeof UpdateActionRequest>

export const DuplicateStepRequest = z.object({
    stepName: z.string(),
})

export type DuplicateStepRequest = z.infer<typeof DuplicateStepRequest>

export const MoveActionRequest = z.object({
    name: z.string(),
    newParentStep: z.string(),
    stepLocationRelativeToNewParent: z.nativeEnum(StepLocationRelativeToParent).optional(),
    branchIndex: z.number().optional(),
})
export type MoveActionRequest = z.infer<typeof MoveActionRequest>

export const AddActionRequest = z.object({
    parentStep: z.string(),
    stepLocationRelativeToParent: z.nativeEnum(StepLocationRelativeToParent).optional(),
    branchIndex: z.number().optional(),
    action: UpdateActionRequest,
})
export type AddActionRequest = z.infer<typeof AddActionRequest>

export const UpdateTriggerRequest = z.union([
    EmptyTrigger.omit({ lastUpdatedDate: true }),
    PieceTrigger.omit({ lastUpdatedDate: true, settings: true }).and(z.object({ settings: PieceTriggerSettings.omit({ sampleData: true }) })),
])
export type UpdateTriggerRequest = z.infer<typeof UpdateTriggerRequest>

export const UpdateFlowStatusRequest = z.object({
    status: z.nativeEnum(FlowStatus),
})
export type UpdateFlowStatusRequest = z.infer<typeof UpdateFlowStatusRequest>

export const ChangePublishedVersionIdRequest = z.object({
    status: z.nativeEnum(FlowStatus).optional(),
})
export type ChangePublishedVersionIdRequest = z.infer<
    typeof ChangePublishedVersionIdRequest
>

export const UpdateMetadataRequest = z.object({
    metadata: Nullable(Metadata),
})
export type UpdateMetadataRequest = z.infer<typeof UpdateMetadataRequest>

export const UpdateMinutesSavedRequest = z.object({
    timeSavedPerRun: Nullable(z.number()),
})
export type UpdateMinutesSavedRequest = z.infer<typeof UpdateMinutesSavedRequest>

export const UpdateOwnerRequest = z.object({
    ownerId: z.string(),
})
export type UpdateOwnerRequest = z.infer<typeof UpdateOwnerRequest>

export const FlowOperationRequest = z.union([
    z.object({
        type: z.literal(FlowOperationType.MOVE_ACTION),
        request: MoveActionRequest,
    }).describe('Move Action'),
    z.object({
        type: z.literal(FlowOperationType.CHANGE_STATUS),
        request: UpdateFlowStatusRequest,
    }).describe('Change Status'),
    z.object({
        type: z.literal(FlowOperationType.LOCK_AND_PUBLISH),
        request: ChangePublishedVersionIdRequest,
    }).describe('Lock and Publish'),
    z.object({
        type: z.literal(FlowOperationType.USE_AS_DRAFT),
        request: UseAsDraftRequest,
    }).describe('Copy as Draft'),
    z.object({
        type: z.literal(FlowOperationType.LOCK_FLOW),
        request: LockFlowRequest,
    }).describe('Lock Flow'),
    z.object({
        type: z.literal(FlowOperationType.IMPORT_FLOW),
        request: ImportFlowRequest,
    }).describe('Import Flow'),
    z.object({
        type: z.literal(FlowOperationType.CHANGE_NAME),
        request: ChangeNameRequest,
    }).describe('Change Name'),
    z.object({
        type: z.literal(FlowOperationType.DELETE_ACTION),
        request: DeleteActionRequest,
    }).describe('Delete Action'),
    z.object({
        type: z.literal(FlowOperationType.UPDATE_ACTION),
        request: UpdateActionRequest,
    }).describe('Update Action'),
    z.object({
        type: z.literal(FlowOperationType.ADD_ACTION),
        request: AddActionRequest,
    }).describe('Add Action'),
    z.object({
        type: z.literal(FlowOperationType.UPDATE_TRIGGER),
        request: UpdateTriggerRequest,
    }).describe('Update Trigger'),
    z.object({
        type: z.literal(FlowOperationType.CHANGE_FOLDER),
        request: ChangeFolderRequest,
    }).describe('Change Folder'),
    z.object({
        type: z.literal(FlowOperationType.DUPLICATE_ACTION),
        request: DuplicateStepRequest,
    }).describe('Duplicate Action'),
    z.object({
        type: z.literal(FlowOperationType.DELETE_BRANCH),
        request: DeleteBranchRequest,
    }).describe('Delete Branch'),
    z.object({
        type: z.literal(FlowOperationType.ADD_BRANCH),
        request: AddBranchRequest,
    }).describe('Add Branch'),
    z.object({
        type: z.literal(FlowOperationType.DUPLICATE_BRANCH),
        request: DuplicateBranchRequest,
    }).describe('Duplicate Branch'),
    z.object({
        type: z.literal(FlowOperationType.SET_SKIP_ACTION),
        request: SkipActionRequest,
    }).describe('Skip Action'),
    z.object({
        type: z.literal(FlowOperationType.UPDATE_METADATA),
        request: UpdateMetadataRequest,
    }).describe('Update Metadata'),
    z.object({
        type: z.literal(FlowOperationType.MOVE_BRANCH),
        request: MoveBranchRequest,
    }),
    z.object({
        type: z.literal(FlowOperationType.SAVE_SAMPLE_DATA),
        request: SaveSampleDataRequest,
    }),
    z.object({
        type: z.literal(FlowOperationType.UPDATE_MINUTES_SAVED),
        request: UpdateMinutesSavedRequest,
    }).describe('Update Minutes Saved'),
    z.object({
        type: z.literal(FlowOperationType.UPDATE_OWNER),
        request: UpdateOwnerRequest,
    }).describe('Update Owner'),
    z.object({
        type: z.literal(FlowOperationType.UPDATE_NOTE),
        request: UpdateNoteRequest,
    }).describe('Update Note'),
    z.object({
        type: z.literal(FlowOperationType.DELETE_NOTE),
        request: DeleteNoteRequest,
    }).describe('Delete Note'),
    z.object({
        type: z.literal(FlowOperationType.ADD_NOTE),
        request: AddNoteRequest,
    }).describe('Add Note'),
    z.object({
        type: z.literal(FlowOperationType.UPDATE_SAMPLE_DATA_INFO),
        request: UpdateSampleDataInfoRequest,
    }).describe('Update Sample Data Info'),
])



export type FlowOperationRequest = z.infer<typeof FlowOperationRequest>

export const flowOperations = {
    getActionsForCopy: _getActionsForCopy,
    getOperationsForPaste: _getOperationsForPaste,
    apply(flowVersion: FlowVersion, operation: FlowOperationRequest): FlowVersion {
        let clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
        switch (operation.type) {
            case FlowOperationType.MOVE_ACTION: {
                const operations: FlowOperationRequest[] = _moveAction(clonedVersion, operation.request)
                operations.forEach((operation) => {
                    clonedVersion = flowOperations.apply(clonedVersion, operation)
                })
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
                if (operation.request.action.type === FlowActionType.PIECE) {
                    operation.request.action.settings.pieceVersion = flowPieceUtil.getExactVersion(operation.request.action.settings.pieceVersion)
                }
                clonedVersion = _addAction(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.DELETE_ACTION: {
                clonedVersion = _deleteAction(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.UPDATE_TRIGGER: {
                if (operation.request.type === FlowTriggerType.PIECE) {
                    operation.request.settings.pieceVersion = flowPieceUtil.getExactVersion(operation.request.settings.pieceVersion)
                }
                clonedVersion = _updateTrigger(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.ADD_BRANCH: {
                clonedVersion = _addBranch(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.DELETE_BRANCH: {
                clonedVersion = _deleteBranch(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.UPDATE_ACTION: {
                if (operation.request.type === FlowActionType.PIECE) {
                    operation.request.settings.pieceVersion = flowPieceUtil.getExactVersion(operation.request.settings.pieceVersion)
                }
                clonedVersion = _updateAction(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.IMPORT_FLOW: {
                const operations = _importFlow(clonedVersion, operation.request)
                operations.forEach((operation) => {
                    clonedVersion = flowOperations.apply(clonedVersion, operation)
                })
                break
            }
            case FlowOperationType.SET_SKIP_ACTION: {
                clonedVersion = _skipAction(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.MOVE_BRANCH: {
                clonedVersion = _moveBranch(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.UPDATE_NOTE: {
                clonedVersion = notesOperations.updateNote(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.DELETE_NOTE: {
                clonedVersion = notesOperations.deleteNote(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.ADD_NOTE: {
                clonedVersion = notesOperations.addNote(clonedVersion, operation.request)
                break
            }
            case FlowOperationType.UPDATE_SAMPLE_DATA_INFO: {
                clonedVersion = _updateSampleDataInfo(clonedVersion, operation.request)
                break
            }
            default:
                break
        }
        clonedVersion.valid = flowStructureUtil.getAllSteps(clonedVersion.trigger).every((step) => {
            const isSkipped = step.type != FlowTriggerType.EMPTY && step.type != FlowTriggerType.PIECE && step.skip
            return step.valid || isSkipped
        })
        return clonedVersion
    },
}
