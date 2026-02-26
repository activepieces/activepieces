import { FlowVersion, FlowVersionState } from '../flow-version'
import { FlowTriggerType } from '../triggers/trigger'
import { flowPieceUtil } from '../util/flow-piece-util'
import { flowStructureUtil } from '../util/flow-structure-util'
import { actionOperations } from './action-operations'
import { branchOperations } from './branch-operations'
import { compositeOperations } from './composite-operations'
import { ChangeNameRequest, DuplicateBranchRequest, DuplicateStepRequest, FlowOperationRequest, FlowOperationType } from './index'
import { noteOperations } from './note-operations'
import { triggerOperations } from './trigger-operations'

function changeName(flow: FlowVersion, request: ChangeNameRequest): FlowVersion {
    flow.displayName = request.displayName
    return flow
}

function lockFlow(flow: FlowVersion): FlowVersion {
    flow.state = FlowVersionState.LOCKED
    return flow
}

let directMap: Record<string, DirectEntry> | undefined
let compositeMap: Record<string, CompositeEntry> | undefined

function getDirectMap(): Record<string, DirectEntry> {
    if (!directMap) {
        directMap = {
            [FlowOperationType.ADD_ACTION]:      { fn: actionOperations.add,      autoUpgrade: true },
            [FlowOperationType.DELETE_ACTION]:    { fn: actionOperations.remove,   autoUpgrade: true },
            [FlowOperationType.UPDATE_ACTION]:    { fn: actionOperations.update,   autoUpgrade: true },
            [FlowOperationType.SET_SKIP_ACTION]:  { fn: actionOperations.skip,     autoUpgrade: false },
            [FlowOperationType.UPDATE_TRIGGER]:   { fn: triggerOperations.update,  autoUpgrade: true },
            [FlowOperationType.ADD_BRANCH]:       { fn: branchOperations.add,      autoUpgrade: true },
            [FlowOperationType.DELETE_BRANCH]:    { fn: branchOperations.remove,   autoUpgrade: true },
            [FlowOperationType.MOVE_BRANCH]:      { fn: branchOperations.move,     autoUpgrade: true },
            [FlowOperationType.CHANGE_NAME]:      { fn: changeName,                autoUpgrade: false },
            [FlowOperationType.LOCK_FLOW]:        { fn: lockFlow,                  autoUpgrade: false },
            [FlowOperationType.UPDATE_NOTE]:      { fn: noteOperations.update,     autoUpgrade: false },
            [FlowOperationType.DELETE_NOTE]:      { fn: noteOperations.remove,     autoUpgrade: false },
            [FlowOperationType.ADD_NOTE]:         { fn: noteOperations.add,        autoUpgrade: false },
        }
    }
    return directMap
}

function getCompositeMap(): Record<string, CompositeEntry> {
    if (!compositeMap) {
        compositeMap = {
            [FlowOperationType.MOVE_ACTION]:      { fn: compositeOperations.moveAction, autoUpgrade: true },
            [FlowOperationType.DUPLICATE_ACTION]: {
                fn: (flow, request) => compositeOperations.duplicateStep((request as DuplicateStepRequest).stepName, flow),
                autoUpgrade: false,
            },
            [FlowOperationType.DUPLICATE_BRANCH]: {
                fn: (flow, request) => {
                    const r = request as DuplicateBranchRequest
                    return compositeOperations.duplicateBranch(r.stepName, r.branchIndex, flow)
                },
                autoUpgrade: false,
            },
            [FlowOperationType.IMPORT_FLOW]:      { fn: compositeOperations.importFlow, autoUpgrade: false },
        }
    }
    return compositeMap
}

export const flowOperations = {
    getActionsForCopy: compositeOperations.getActionsForCopy,
    getOperationsForPaste: compositeOperations.getOperationsForPaste,
    apply(flowVersion: FlowVersion, operation: FlowOperationRequest): FlowVersion {
        let cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))

        const direct = getDirectMap()[operation.type]
        const composite = getCompositeMap()[operation.type]

        if (composite) {
            const ops = composite.fn(cloned, operation.request)
            for (const op of ops) {
                cloned = flowOperations.apply(cloned, op)
            }
            if (composite.autoUpgrade) {
                cloned = flowPieceUtil.makeFlowAutoUpgradable(cloned)
            }
        }
        else if (direct) {
            cloned = direct.fn(cloned, operation.request)
            if (direct.autoUpgrade) {
                cloned = flowPieceUtil.makeFlowAutoUpgradable(cloned)
            }
        }

        cloned.valid = flowStructureUtil.getAllSteps(cloned).every((step) => {
            const isSkipped = step.type != FlowTriggerType.EMPTY && step.type != FlowTriggerType.PIECE && step.skip
            return step.valid || isSkipped
        })
        return cloned
    },
}

type DirectEntry = {
    fn: (flow: FlowVersion, request: never) => FlowVersion
    autoUpgrade: boolean
}

type CompositeEntry = {
    fn: (flow: FlowVersion, request: never) => FlowOperationRequest[]
    autoUpgrade: boolean
}
