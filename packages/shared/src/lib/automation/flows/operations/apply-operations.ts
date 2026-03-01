import { FlowVersion, FlowVersionState } from '../flow-version'
import { FlowNodeType, isActionNodeData } from '../graph/flow-graph'
import { flowPieceUtil } from '../util/flow-piece-util'
import { flowStructureUtil } from '../util/flow-structure-util'
import { actionOperations } from './action-operations'
import { branchOperations } from './branch-operations'
import { compositeOperations } from './composite-operations'
import { noteOperations } from './note-operations'
import { triggerOperations } from './trigger-operations'
import { ChangeNameRequest, FlowOperationRequest, FlowOperationType } from './index'

function changeName(flow: FlowVersion, request: ChangeNameRequest): FlowVersion {
    flow.displayName = request.displayName
    return flow
}

function lockFlow(flow: FlowVersion): FlowVersion {
    flow.state = FlowVersionState.LOCKED
    return flow
}

function applyDirect(cloned: FlowVersion, operation: FlowOperationRequest): { result: FlowVersion, autoUpgrade: boolean } | null {
    switch (operation.type) {
        case FlowOperationType.ADD_ACTION:
            return { result: actionOperations.add(cloned, operation.request), autoUpgrade: true }
        case FlowOperationType.DELETE_ACTION:
            return { result: actionOperations.remove(cloned, operation.request), autoUpgrade: true }
        case FlowOperationType.UPDATE_ACTION:
            return { result: actionOperations.update(cloned, operation.request), autoUpgrade: true }
        case FlowOperationType.SET_SKIP_ACTION:
            return { result: actionOperations.skip(cloned, operation.request), autoUpgrade: false }
        case FlowOperationType.UPDATE_TRIGGER:
            return { result: triggerOperations.update(cloned, operation.request), autoUpgrade: true }
        case FlowOperationType.ADD_BRANCH:
            return { result: branchOperations.add(cloned, operation.request), autoUpgrade: true }
        case FlowOperationType.DELETE_BRANCH:
            return { result: branchOperations.remove(cloned, operation.request), autoUpgrade: true }
        case FlowOperationType.MOVE_BRANCH:
            return { result: branchOperations.move(cloned, operation.request), autoUpgrade: true }
        case FlowOperationType.UPDATE_BRANCH:
            return { result: branchOperations.update(cloned, operation.request), autoUpgrade: true }
        case FlowOperationType.CHANGE_NAME:
            return { result: changeName(cloned, operation.request), autoUpgrade: false }
        case FlowOperationType.LOCK_FLOW:
            return { result: lockFlow(cloned), autoUpgrade: false }
        case FlowOperationType.UPDATE_NOTE:
            return { result: noteOperations.update(cloned, operation.request), autoUpgrade: false }
        case FlowOperationType.DELETE_NOTE:
            return { result: noteOperations.remove(cloned, operation.request), autoUpgrade: false }
        case FlowOperationType.ADD_NOTE:
            return { result: noteOperations.add(cloned, operation.request), autoUpgrade: false }
        default:
            return null
    }
}

function applyComposite(cloned: FlowVersion, operation: FlowOperationRequest): { ops: FlowOperationRequest[], autoUpgrade: boolean } | null {
    switch (operation.type) {
        case FlowOperationType.MOVE_ACTION:
            return { ops: compositeOperations.moveAction(cloned, operation.request), autoUpgrade: true }
        case FlowOperationType.DUPLICATE_ACTION:
            return { ops: compositeOperations.duplicateStep(operation.request.stepName, cloned), autoUpgrade: false }
        case FlowOperationType.DUPLICATE_BRANCH:
            return { ops: compositeOperations.duplicateBranch(operation.request.stepName, operation.request.branchIndex, cloned), autoUpgrade: false }
        case FlowOperationType.IMPORT_FLOW:
            return { ops: compositeOperations.importFlow(cloned, operation.request), autoUpgrade: false }
        default:
            return null
    }
}

export const flowOperations = {
    getActionsForCopy: compositeOperations.getActionsForCopy,
    getOperationsForPaste: compositeOperations.getOperationsForPaste,
    apply(flowVersion: FlowVersion, operation: FlowOperationRequest): FlowVersion {
        let cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))

        const composite = applyComposite(cloned, operation)
        const direct = !composite ? applyDirect(cloned, operation) : null

        if (composite) {
            for (const op of composite.ops) {
                cloned = flowOperations.apply(cloned, op)
            }
            if (composite.autoUpgrade) {
                cloned = flowPieceUtil.makeFlowAutoUpgradable(cloned)
            }
        }
        else if (direct) {
            cloned = direct.result
            if (direct.autoUpgrade) {
                cloned = flowPieceUtil.makeFlowAutoUpgradable(cloned)
            }
        }

        cloned.valid = flowStructureUtil.getAllSteps(cloned).every((node) => {
            const isTriggerNode = node.type === FlowNodeType.TRIGGER
            const isSkipped = !isTriggerNode && isActionNodeData(node.data) && node.data.skip
            return node.data.valid || isSkipped
        })
        return cloned
    },
}
