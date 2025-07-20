import { ActionType, BranchExecutionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { MoveBranchRequest } from '.'


const isIndexWithinBounds = (index: number, arrayLength: number) => index >= 0 && index < arrayLength
export function _moveBranch(flowVersion: FlowVersion, request: MoveBranchRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== request.stepName || stepToUpdate.type !== ActionType.ROUTER) {
            return stepToUpdate
        }
        const routerStep = stepToUpdate
        if (!isIndexWithinBounds(request.sourceBranchIndex, routerStep.settings.branches.length) || !isIndexWithinBounds(request.targetBranchIndex, routerStep.settings.branches.length) || request.sourceBranchIndex === request.targetBranchIndex) {
            return stepToUpdate
        }
        if (routerStep.settings.branches[request.sourceBranchIndex].branchType === BranchExecutionType.FALLBACK || routerStep.settings.branches[request.targetBranchIndex].branchType === BranchExecutionType.FALLBACK) {
            return stepToUpdate
        }
        const sourceBranch = routerStep.settings.branches[request.sourceBranchIndex]
        routerStep.settings.branches.splice(request.sourceBranchIndex, 1)
        routerStep.settings.branches.splice(request.targetBranchIndex, 0, sourceBranch)
        const sourceBranchChildren = routerStep.children[request.sourceBranchIndex]
        routerStep.children.splice(request.sourceBranchIndex, 1)
        routerStep.children.splice(request.targetBranchIndex, 0, sourceBranchChildren)
        return routerStep
    })

}