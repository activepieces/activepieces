import { BranchExecutionType, FlowActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { MoveBranchRequest } from '.'


const isIndexWithinBounds = (index: number, arrayLength: number) => index >= 0 && index < arrayLength

export function _moveBranch(flowVersion: FlowVersion, request: MoveBranchRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== request.stepName || !flowStructureUtil.isBranchedAction(stepToUpdate)) {
            return stepToUpdate
        }
        const branches = stepToUpdate.settings.branches
        if (!isIndexWithinBounds(request.sourceBranchIndex, branches.length) || !isIndexWithinBounds(request.targetBranchIndex, branches.length) || request.sourceBranchIndex === request.targetBranchIndex) {
            return stepToUpdate
        }
        if (branches[request.sourceBranchIndex].branchType === BranchExecutionType.FALLBACK || branches[request.targetBranchIndex].branchType === BranchExecutionType.FALLBACK) {
            return stepToUpdate
        }
        const children = stepToUpdate.children
        const sourceChild = children[request.sourceBranchIndex]
        children.splice(request.sourceBranchIndex, 1)
        children.splice(request.targetBranchIndex, 0, sourceChild)

        if (stepToUpdate.type === FlowActionType.AI_ROUTER) {
            const aiBranches = stepToUpdate.settings.branches
            const [moved] = aiBranches.splice(request.sourceBranchIndex, 1)
            aiBranches.splice(request.targetBranchIndex, 0, moved)
            return stepToUpdate
        }
        const routerBranches = stepToUpdate.settings.branches
        const [moved] = routerBranches.splice(request.sourceBranchIndex, 1)
        routerBranches.splice(request.targetBranchIndex, 0, moved)
        return stepToUpdate
    })
}
