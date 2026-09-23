import { FlowActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { DeleteBranchRequest } from '.'

function _deleteBranch(flowVersion: FlowVersion, request: DeleteBranchRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name !== request.stepName || !flowStructureUtil.isBranchedAction(parentStep)) {
            return parentStep
        }
        const keep = (_: unknown, index: number) => index !== request.branchIndex
        const children = parentStep.children.filter(keep)
        if (parentStep.type === FlowActionType.AI_ROUTER) {
            return {
                ...parentStep,
                settings: { ...parentStep.settings, branches: parentStep.settings.branches.filter(keep) },
                children,
            }
        }
        return {
            ...parentStep,
            settings: { ...parentStep.settings, branches: parentStep.settings.branches.filter(keep) },
            children,
        }
    })
}

export { _deleteBranch }
