import { TypeCompiler } from '@sinclair/typebox/compiler'
import { isNil } from '../../common'
import { Action } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { Trigger, TriggerType } from '../triggers/trigger'
import { flowStructureUtil } from '../util/flow-structure-util'
import { UpdateTriggerRequest } from '.'

const triggerSchemaValidation = TypeCompiler.Compile(Trigger)

function createTrigger(name: string, request: UpdateTriggerRequest, nextAction: Action | undefined): Trigger {
    const baseProperties = {
        displayName: request.displayName,
        name,
        valid: false,
        nextAction,
    }
    let trigger: Trigger
    switch (request.type) {
        case TriggerType.EMPTY:
            trigger = {
                ...baseProperties,
                type: TriggerType.EMPTY,
                settings: request.settings,
            }
            break
        case TriggerType.PIECE:
            trigger = {
                ...baseProperties,
                type: TriggerType.PIECE,
                settings: request.settings,
            }
            break
    }
    const valid = (isNil(request.valid) ? true : request.valid) && triggerSchemaValidation.Check(trigger)
    return {
        ...trigger,
        valid,
    }
}

function _updateTrigger(flowVersion: FlowVersion, request: UpdateTriggerRequest): FlowVersion {
    const trigger = flowStructureUtil.getStepOrThrow(request.name, flowVersion.trigger)
    const updatedTrigger = createTrigger(request.name, request, trigger.nextAction)
    return flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name === request.name) {
            return updatedTrigger
        }
        return parentStep
    })
}

export { _updateTrigger }