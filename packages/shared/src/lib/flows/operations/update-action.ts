import { TypeCompiler } from '@sinclair/typebox/compiler'
import { isNil } from '../../common'
import { Action, ActionType, SingleActionSchema } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { UpdateActionRequest } from './index'

const actionSchemaValidator = TypeCompiler.Compile(SingleActionSchema)

function _updateAction(flowVersion: FlowVersion, request: UpdateActionRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== request.name) {
            return stepToUpdate
        }
     
        const baseProps: Omit<Action, 'type' | 'settings'> = {
            displayName: request.displayName,
            name: request.name,
            valid: false,
        }

        let updatedAction: Action
        switch (request.type) {
            case ActionType.CODE: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: ActionType.CODE,
                    nextAction: stepToUpdate.nextAction,
                }
                break
            }
            case ActionType.PIECE: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: ActionType.PIECE,
                    nextAction: stepToUpdate.nextAction,
                }
                break
            }
            case ActionType.LOOP_ON_ITEMS: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: ActionType.LOOP_ON_ITEMS,
                    firstLoopAction: 'firstLoopAction' in stepToUpdate ? stepToUpdate.firstLoopAction : undefined,
                    nextAction: stepToUpdate.nextAction,
                }
                break
            }
          
            case ActionType.ROUTER: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: ActionType.ROUTER,
                    nextAction: stepToUpdate.nextAction,
                    children: 'children' in stepToUpdate ? stepToUpdate.children : [null, null],
                }
                break
            }
        }
        const valid = (isNil(request.valid) ? true : request.valid) && actionSchemaValidator.Check(updatedAction)
        return {
            ...updatedAction,
            valid,
        }
    })
}

export { _updateAction }