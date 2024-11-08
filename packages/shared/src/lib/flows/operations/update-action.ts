import { TypeCompiler } from '@sinclair/typebox/compiler'
import { isNil } from '../../common'
import { ActivepiecesError, ErrorCode } from '../../common/activepieces-error'
import { Action, SingleActionSchema } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { UpdateActionRequest } from './index'

const actionSchemaValidator = TypeCompiler.Compile(SingleActionSchema)

function _updateAction(flowVersion: FlowVersion, request: UpdateActionRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name !== request.name) {
            return parentStep
        }
        if (parentStep.type !== request.type) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_OPERATION_INVALID,
                params: {
                    message: `Step type mismatch: ${parentStep.type} !== ${request.type}`,
                },
            })
        }
        const baseProps: Omit<Action, 'type' | 'settings'> = {
            displayName: request.displayName,
            name: request.name,
            valid: false,
        }
        const updatedAction = {
            ...parentStep,
            ...baseProps,
            type: request.type,
            settings: request.settings,
        } as Action
        const valid = (isNil(request.valid) ? true : request.valid) && actionSchemaValidator.Check(updatedAction)
        return {
            ...updatedAction,
            valid,
        }
    })
}

export { _updateAction }
