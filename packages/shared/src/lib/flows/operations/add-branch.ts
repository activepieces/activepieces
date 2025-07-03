import { insertAt } from '../../common'
import { ActionType, RouterAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { AddBranchRequest } from '.'


function _addBranch(flowVersion: FlowVersion, request: AddBranchRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name !== request.stepName || parentStep.type !== ActionType.ROUTER) {
            return parentStep
        }
        const routerAction = parentStep as RouterAction
        return {
            ...routerAction,
            settings: {
                ...routerAction.settings,
                branches: insertAt(routerAction.settings.branches, request.branchIndex, flowStructureUtil.createBranch(request.branchName, request.conditions)),
            },
            children: insertAt(routerAction.children, request.branchIndex, null),
        }
    })
}


export { _addBranch }