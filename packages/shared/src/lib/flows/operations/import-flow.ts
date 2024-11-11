import { isNil } from '../../common'
import { Action, ActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { Trigger, TriggerType } from '../triggers/trigger'
import { Step } from '../util/flow-structure-util'
import { FlowOperationRequest, FlowOperationType, ImportFlowRequest, StepLocationRelativeToParent } from './index'

function getAllActionsThatDoesNotHaveParent(trigger: Step): Step[] {
    const actions: Step[] = []
    let currentAction = trigger.nextAction

    while (!isNil(currentAction)) {
        actions.push(currentAction)
        currentAction = currentAction.nextAction
    }

    return actions
}

function createDeleteActionOperation(actionName: string): FlowOperationRequest {
    return {
        type: FlowOperationType.DELETE_ACTION,
        request: { name: actionName },
    }
}

function createUpdateTriggerOperation(trigger: Trigger): FlowOperationRequest {
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

function _getImportOperations(step: Action | Trigger | undefined): FlowOperationRequest[] {
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
            case ActionType.LOOP_ON_ITEMS: {
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
            case ActionType.ROUTER: {
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
            case ActionType.CODE:
            case ActionType.PIECE:
            case TriggerType.PIECE:
            case TriggerType.EMPTY: {
                break
            }
        }

        step = step.nextAction
    }
    return steps
}

function removeAnySubsequentAction(action: Action): Action {
    const clonedAction: Action = JSON.parse(JSON.stringify(action))
    switch (clonedAction.type) {
        case ActionType.ROUTER: {
            clonedAction.children = clonedAction.children.map((child: Action | null) => {
                if (isNil(child)) {
                    return null
                }
                return removeAnySubsequentAction(child)
            })
            break
        }
        case ActionType.LOOP_ON_ITEMS: {
            delete clonedAction.firstLoopAction
            break
        }
        case ActionType.PIECE:
        case ActionType.CODE:
            break
    }
    delete clonedAction.nextAction
    return clonedAction
}

function _importFlow(flowVersion: FlowVersion, request: ImportFlowRequest): FlowOperationRequest[] {
    const existingActions = getAllActionsThatDoesNotHaveParent(flowVersion.trigger)

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