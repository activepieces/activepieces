import { insertAt } from '../../../core/common'
import { BranchExecutionType, FlowActionType, RouterAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { AddBranchRequest, DeleteBranchRequest, MoveBranchRequest } from './index'

// --- Add Branch ---

function add(flowVersion: FlowVersion, request: AddBranchRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name !== request.stepName || parentStep.type !== FlowActionType.ROUTER) {
            return parentStep
        }
        const routerAction = parentStep as RouterAction
        const newBranch = flowStructureUtil.createBranch(request.branchName, request.conditions)
        return {
            ...routerAction,
            branches: insertAt(routerAction.branches ?? [], request.branchIndex, newBranch),
        }
    })
}

// --- Delete Branch ---

function collectAllDescendants(stepNames: string[], flowVersion: FlowVersion): string[] {
    const result: string[] = []
    for (const name of stepNames) {
        result.push(name)
        const step = flowVersion.steps.find((s) => s.name === name)
        if (step) {
            const childRefs = flowStructureUtil.getDirectChildRefs(step)
            result.push(...collectAllDescendants(childRefs, flowVersion))
        }
    }
    return result
}

function remove(flowVersion: FlowVersion, request: DeleteBranchRequest): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    const routerStep = cloned.steps.find((s) => s.name === request.stepName && s.type === FlowActionType.ROUTER) as RouterAction | undefined
    if (!routerStep || !routerStep.branches) {
        return cloned
    }

    const deletedBranch = routerStep.branches[request.branchIndex]
    const stepsToRemove = deletedBranch ? collectAllDescendants(deletedBranch.steps ?? [], cloned) : []

    routerStep.branches = routerStep.branches.filter((_, index) => index !== request.branchIndex)

    cloned.steps = cloned.steps.filter((s) => !stepsToRemove.includes(s.name))

    return cloned
}

// --- Move Branch ---

function isIndexWithinBounds(index: number, arrayLength: number): boolean {
    return index >= 0 && index < arrayLength
}

function move(flowVersion: FlowVersion, request: MoveBranchRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== request.stepName || stepToUpdate.type !== FlowActionType.ROUTER) {
            return stepToUpdate
        }
        const routerStep = stepToUpdate as RouterAction
        if (!routerStep.branches || !isIndexWithinBounds(request.sourceBranchIndex, routerStep.branches.length) || !isIndexWithinBounds(request.targetBranchIndex, routerStep.branches.length) || request.sourceBranchIndex === request.targetBranchIndex) {
            return stepToUpdate
        }
        if (routerStep.branches[request.sourceBranchIndex].branchType === BranchExecutionType.FALLBACK || routerStep.branches[request.targetBranchIndex].branchType === BranchExecutionType.FALLBACK) {
            return stepToUpdate
        }
        const sourceBranch = routerStep.branches[request.sourceBranchIndex]
        routerStep.branches.splice(request.sourceBranchIndex, 1)
        routerStep.branches.splice(request.targetBranchIndex, 0, sourceBranch)
        return routerStep
    })
}

export const branchOperations = { add, remove, move }
