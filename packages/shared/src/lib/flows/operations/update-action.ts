import { TypeCompiler } from '@sinclair/typebox/compiler'
import { isNil } from '../../common'
import { FlowAction, FlowActionType, SingleActionSchema } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { UpdateActionRequest } from './index'

const actionSchemaValidator = TypeCompiler.Compile(SingleActionSchema)

function _updateAction(flowVersion: FlowVersion, request: UpdateActionRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== request.name) {
            return stepToUpdate
        }
     
        const baseProps: Omit<FlowAction, 'type'> = {
            displayName: request.displayName,
            name: request.name,
            valid: false,
            skip: request.skip,
            settings: {
                ...stepToUpdate.settings,
                customLogoUrl: request.settings.customLogoUrl,
            },
        }

        let updatedAction: FlowAction
        switch (request.type) {
            case FlowActionType.CODE: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: FlowActionType.CODE,
                    nextAction: stepToUpdate.nextAction,
                }
                break
            }
            case FlowActionType.PIECE: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: FlowActionType.PIECE,
                    nextAction: stepToUpdate.nextAction,
                }
                break
            }
            case FlowActionType.LOOP_ON_ITEMS: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: FlowActionType.LOOP_ON_ITEMS,
                    firstLoopAction: 'firstLoopAction' in stepToUpdate ? stepToUpdate.firstLoopAction : undefined,
                    nextAction: stepToUpdate.nextAction,
                }
                break
            }
          
            case FlowActionType.ROUTER: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: FlowActionType.ROUTER,
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