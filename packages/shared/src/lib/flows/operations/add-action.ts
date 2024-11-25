import { TypeCompiler } from '@sinclair/typebox/compiler'
import { isNil } from '../../common'
import { ActivepiecesError, ErrorCode } from '../../common/activepieces-error'
import { Action, ActionType, LoopOnItemsAction, RouterAction, SingleActionSchema } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil, Step } from '../util/flow-structure-util'
import { AddActionRequest, StepLocationRelativeToParent, UpdateActionRequest } from './index'

const actionSchemaValidator = TypeCompiler.Compile(SingleActionSchema)

type ActionCreationProps = {
    nextAction?: Action
}

function createAction(request: UpdateActionRequest, {
    nextAction,
}: ActionCreationProps): Action {
    const baseProperties = {
        displayName: request.displayName,
        name: request.name,
        valid: false,
        nextAction,
    }
    let action: Action
    switch (request.type) {
        case ActionType.ROUTER:
            action = {
                ...baseProperties,
                type: ActionType.ROUTER,
                settings: request.settings,
                children: request.settings.branches.map(() => null),
            }

            break
        case ActionType.LOOP_ON_ITEMS:
            action = {
                ...baseProperties,
                type: ActionType.LOOP_ON_ITEMS,
                settings: request.settings,
            }
            break
        case ActionType.PIECE:
            action = {
                ...baseProperties,
                type: ActionType.PIECE,
                settings: request.settings,
            }
            break
        case ActionType.CODE:
            action = {
                ...baseProperties,
                type: ActionType.CODE,
                settings: request.settings,
            }
            break
    }
    const valid = (isNil(request.valid) ? true : request.valid) && actionSchemaValidator.Check(action)
    return {
        ...action,
        valid,
    }
}

function handleLoopOnItems(parentStep: LoopOnItemsAction, request: AddActionRequest): Step {
    if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_LOOP) {
        parentStep.firstLoopAction = createAction(request.action, {
            nextAction: parentStep.firstLoopAction,
        })
    }
    else if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.AFTER) {
        parentStep.nextAction = createAction(request.action, {
            nextAction: parentStep.nextAction,
        })
    }
    else {
        throw new ActivepiecesError(
            {
                code: ErrorCode.FLOW_OPERATION_INVALID,
                params: {
                    message: `Loop step parent ${request.stepLocationRelativeToParent} not found`,
                },
            })
    }
    return parentStep
}

function handleRouter(parentStep: RouterAction, request: AddActionRequest): Step {
    if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_BRANCH && !isNil(request.branchIndex)) {
        parentStep.children[request.branchIndex] = createAction(request.action, {
            nextAction: parentStep.children[request.branchIndex] ?? undefined,
        })
    }
    else if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.AFTER) {
        parentStep.nextAction = createAction(request.action, {
            nextAction: parentStep.nextAction,
        })
    }
    else {
        throw new ActivepiecesError({
            code: ErrorCode.FLOW_OPERATION_INVALID,
            params: {
                message: `Router step parent ${request.stepLocationRelativeToParent} not found`,
            },
        })
    }
    return parentStep
}

function _addAction(flowVersion: FlowVersion, request: AddActionRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (parentStep: Step) => {
        if (parentStep.name !== request.parentStep) {
            return parentStep
        }
        switch (parentStep.type) {
            case ActionType.LOOP_ON_ITEMS:
                return handleLoopOnItems(parentStep, request)
            case ActionType.ROUTER:
                return handleRouter(parentStep, request)
            default: {
                parentStep.nextAction = createAction(request.action, {
                    nextAction: parentStep.nextAction,
                })
                return parentStep
            }
        }
    })
}

export { _addAction }