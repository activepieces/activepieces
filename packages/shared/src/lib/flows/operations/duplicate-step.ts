import { isNil } from '../../common'
import { BranchExecutionType, FlowAction, RouterAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { addActionUtils } from './add-action-util'
import { _getImportOperations } from './import-flow'
import { FlowOperationRequest, FlowOperationType, StepLocationRelativeToParent } from '.'


function _duplicateStep(stepName: string, flowVersion: FlowVersion): FlowOperationRequest[] {
    const clonedAction: FlowAction = JSON.parse(JSON.stringify(flowStructureUtil.getActionOrThrow(stepName, flowVersion.trigger)))
    const clonedActionWithoutNextAction = {
        ...clonedAction,
        nextAction: undefined,
    }
    const oldNameToNewName = addActionUtils.mapToNewNames(flowVersion, [clonedActionWithoutNextAction])
    const clonedSubflow = flowStructureUtil.transferStep(clonedActionWithoutNextAction, (step: FlowAction) => {
        return addActionUtils.clone(step, oldNameToNewName)
    })
    const importOperations = _getImportOperations(clonedSubflow)

    return [
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                action: clonedSubflow as FlowAction,
                parentStep: stepName,
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            },
        },
        ...importOperations,
    ]
}

function _duplicateBranch(
    routerName: string,
    childIndex: number,
    flowVersion: FlowVersion,
): FlowOperationRequest[] {
    const router = flowStructureUtil.getActionOrThrow(routerName, flowVersion.trigger)
    const clonedRouter: RouterAction = JSON.parse(JSON.stringify(router))
    const operations: FlowOperationRequest[] = [{
        type: FlowOperationType.ADD_BRANCH,
        request: {
            branchName: `${clonedRouter.settings.branches[childIndex].branchName} Copy`,
            branchIndex: childIndex + 1,
            stepName: routerName,
            conditions: clonedRouter.settings.branches[childIndex].branchType === BranchExecutionType.CONDITION ? clonedRouter.settings.branches[childIndex].conditions : undefined,
        },
    }]

    const childRouter = clonedRouter.children[childIndex]
    if (!isNil(childRouter)) {
        const oldNameToNewName = addActionUtils.mapToNewNames(flowVersion, [childRouter])
        const clonedSubflow = flowStructureUtil.transferStep(childRouter, (step: FlowAction) => {
            return addActionUtils.clone(step, oldNameToNewName)
        })
        const importOperations = _getImportOperations(clonedSubflow)
        operations.push({
            type: FlowOperationType.ADD_ACTION,
            request: {
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                action: clonedSubflow as FlowAction,
                parentStep: routerName,
                branchIndex: childIndex + 1,
            },
        })
        operations.push(...importOperations)
    }

    return operations
}

export { _duplicateStep, _duplicateBranch }