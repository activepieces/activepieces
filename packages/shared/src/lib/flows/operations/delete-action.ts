import { Action, ActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { DeleteActionRequest } from './index'

function _deleteAction(
    flowVersion: FlowVersion,
    request: DeleteActionRequest,
): FlowVersion {
    const requests = Array.isArray(request) ? request : [request]
    return requests.reduce((flowVersion, request) => {
        return deleteSingleAction(flowVersion, request.name)
    }, flowVersion)
}

const deleteSingleAction = (flowVersion: FlowVersion, name: string) => {
    return flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.nextAction && parentStep.nextAction.name === name) {
            const stepToUpdate: Action = parentStep.nextAction
            parentStep.nextAction = stepToUpdate.nextAction
        }
        switch (parentStep.type) {
            case ActionType.LOOP_ON_ITEMS: {
                if (
                    parentStep.firstLoopAction &&
            parentStep.firstLoopAction.name === name
                ) {
                    const stepToUpdate: Action = parentStep.firstLoopAction
                    parentStep.firstLoopAction = stepToUpdate.nextAction
                }
                break
            }
            case ActionType.ROUTER: {
                parentStep.children = parentStep.children.map((child) => {
                    if (child && child.name === name) {
                        return child.nextAction ?? null
                    }
                    return child
                })
                break
            }
            default:
                break
        }
        return parentStep
    })
}

export { _deleteAction }