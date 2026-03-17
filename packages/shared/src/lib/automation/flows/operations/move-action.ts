import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { _addAction } from './add-action'
import { _deleteAction } from './delete-action'
import { _getImportOperations } from './import-flow'
import { _updateAction } from './update-action'
import { FlowOperationRequest, FlowOperationType, MoveActionRequest } from './index'


export function _moveAction(flowVersion: FlowVersion, request: MoveActionRequest): FlowOperationRequest[] {
    const sourceStep = flowStructureUtil.getActionOrThrow(request.name, flowVersion.trigger)
    flowStructureUtil.getStepOrThrow(request.newParentStep, flowVersion.trigger)
    const sourceStepWithoutNextAction = {
        ...sourceStep,
        nextAction: undefined,
    }
    const deleteOperations: FlowOperationRequest[] = [
        {
            type: FlowOperationType.DELETE_ACTION,
            request: {
                names: [request.name],
            },
        },
    ]
    const addOperations: FlowOperationRequest[] = [
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                action: sourceStepWithoutNextAction,
                parentStep: request.newParentStep,
                stepLocationRelativeToParent: request.stepLocationRelativeToNewParent,
                branchIndex: request.branchIndex,
            },
        },
        ..._getImportOperations(sourceStepWithoutNextAction),
    ]
    return [
        ...deleteOperations,
        ...addOperations,
    ]
}