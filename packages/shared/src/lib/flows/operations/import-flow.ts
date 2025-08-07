import { isNil } from '../../common'
import { FlowAction, FlowActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { FlowTrigger, FlowTriggerType } from '../triggers/trigger'
import { flowStructureUtil } from '../util/flow-structure-util'
import { FlowOperationRequest, FlowOperationType, ImportFlowRequest, StepLocationRelativeToParent } from './index'

function createDeleteActionOperation(actionName: string): FlowOperationRequest {
    return {
        type: FlowOperationType.DELETE_ACTION,
        request: { names: [actionName] },
    }
}

function createUpdateTriggerOperation(trigger: FlowTrigger): FlowOperationRequest {
    return {
        type: FlowOperationType.UPDATE_TRIGGER,
        request: trigger,
    }
}

function createChangeNameOperation(displayName: string): FlowOperationRequest {
    return {
        type: FlowOperationType.CHANGE_NAME,
        request: { displayName },
    }
}

function _getImportOperations(step: FlowAction | FlowTrigger | undefined): FlowOperationRequest[] {
    const steps: FlowOperationRequest[] = []
    while (step) {
        if (step.nextAction) {
            steps.push({
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: step?.name ?? '',
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                    action: removeAnySubsequentAction(step.nextAction),
                },
            })
        }
        switch (step.type) {
            case FlowActionType.LOOP_ON_ITEMS: {
                if (step.firstLoopAction) {
                    steps.push({
                        type: FlowOperationType.ADD_ACTION,
                        request: {
                            parentStep: step.name,
                            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
                            action: removeAnySubsequentAction(step.firstLoopAction),
                        },
                    })
                    steps.push(..._getImportOperations(step.firstLoopAction))
                }
                break
            }
            case FlowActionType.ROUTER: {
                if (step.children) {
                    for (const [index, child] of step.children.entries()) {
                        if (!isNil(child)) {
                            steps.push({
                                type: FlowOperationType.ADD_ACTION,
                                request: {
                                    parentStep: step.name,
                                    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                                    branchIndex: index,
                                    action: removeAnySubsequentAction(child),
                                },
                            })
                            steps.push(..._getImportOperations(child))
                        }
                    }
                }
                break
            }
            case FlowActionType.CODE:
            case FlowActionType.PIECE:
            case FlowTriggerType.PIECE:
            case FlowTriggerType.EMPTY: {
                break
            }
        }

        step = step.nextAction
    }
    return steps
}

function removeAnySubsequentAction(action: FlowAction): FlowAction {
    const clonedAction: FlowAction = JSON.parse(JSON.stringify(action))
    switch (clonedAction.type) {
        case FlowActionType.ROUTER: {
            clonedAction.children = clonedAction.children.map((child: FlowAction | null) => {
                if (isNil(child)) {
                    return null
                }
                return removeAnySubsequentAction(child)
            })
            break
        }
        case FlowActionType.LOOP_ON_ITEMS: {
            delete clonedAction.firstLoopAction
            break
        }
        case FlowActionType.PIECE:
        case FlowActionType.CODE:
            break
    }
    delete clonedAction.nextAction
    return clonedAction
}

function _importFlow(flowVersion: FlowVersion, request: ImportFlowRequest): FlowOperationRequest[] {
    const existingActions = flowStructureUtil.getAllNextActionsWithoutChildren(flowVersion.trigger)

    const deleteOperations = existingActions.map(action =>
        createDeleteActionOperation(action.name),
    )

    const importOperations = _getImportOperations(request.trigger)

    return [
        createChangeNameOperation(request.displayName),
        ...deleteOperations,
        createUpdateTriggerOperation(request.trigger),
        ...importOperations,
    ]
}

export { _importFlow, _getImportOperations }