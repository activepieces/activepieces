import { FlowActionType, RouterAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { DeleteBranchRequest } from '.'

function _deleteBranch(flowVersion: FlowVersion, request: DeleteBranchRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name !== request.stepName || parentStep.type !== FlowActionType.ROUTER) {
            return parentStep
        }
        const routerAction = parentStep as RouterAction
        return {
            ...routerAction,
            settings: {
                ...routerAction.settings,
                branches: routerAction.settings.branches.filter((_, index) => index !== request.branchIndex),
            },
            children: routerAction.children.filter((_, index) => index !== request.branchIndex),
        }
    })
}

export { _deleteBranch } 