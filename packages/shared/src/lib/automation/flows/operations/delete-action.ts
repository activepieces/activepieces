import { FlowAction, FlowActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { DeleteActionRequest } from './index'

function _deleteAction(
    flowVersion: FlowVersion,
    request: DeleteActionRequest,
): FlowVersion {
    let clonedVersion: FlowVersion = flowVersion
    for (const name of request.names) {
        clonedVersion = flowStructureUtil.transferFlow(clonedVersion, (parentStep) => {
            if (parentStep.nextAction && parentStep.nextAction.name === name) {
                const stepToUpdate: FlowAction = parentStep.nextAction
                parentStep.nextAction = stepToUpdate.nextAction
            }
            switch (parentStep.type) {
                case FlowActionType.LOOP_ON_ITEMS: {
                    if (
                        parentStep.firstLoopAction &&
                        parentStep.firstLoopAction.name === name
                    ) {
                        const stepToUpdate: FlowAction = parentStep.firstLoopAction
                        parentStep.firstLoopAction = stepToUpdate.nextAction
                    }
                    break
                }
                case FlowActionType.ROUTER: {
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
    return clonedVersion
}

export { _deleteAction }