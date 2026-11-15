import { AiRouterAction, BranchExecutionType, RouterAction } from '../actions/action'
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
        moveInPlace({ items: stepToUpdate.children, from: request.sourceBranchIndex, to: request.targetBranchIndex })
        moveInPlace<Branch>({ items: stepToUpdate.settings.branches, from: request.sourceBranchIndex, to: request.targetBranchIndex })
        return stepToUpdate
    })
}

function moveInPlace<T>({ items, from, to }: { items: T[], from: number, to: number }): void {
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
}

type Branch = (RouterAction | AiRouterAction)['settings']['branches'][number]
