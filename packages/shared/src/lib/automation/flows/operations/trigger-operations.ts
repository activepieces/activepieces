import { TypeCompiler } from '@sinclair/typebox/compiler'
import { isNil } from '../../../core/common'
import { FlowVersion } from '../flow-version'
import { FlowTrigger, FlowTriggerType } from '../triggers/trigger'
import { UpdateTriggerRequest } from './index'

const triggerSchemaValidation = TypeCompiler.Compile(FlowTrigger)

function createTrigger(name: string, request: UpdateTriggerRequest, existingSteps: string[]): FlowTrigger {
    const baseProperties = {
        displayName: request.displayName,
        name,
        valid: false,
        steps: existingSteps,
    }
    let trigger: FlowTrigger
    switch (request.type) {
        case FlowTriggerType.EMPTY:
            trigger = {
                ...baseProperties,
                type: FlowTriggerType.EMPTY,
                settings: request.settings,
            }
            break
        case FlowTriggerType.PIECE:
            trigger = {
                ...baseProperties,
                type: FlowTriggerType.PIECE,
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

function update(flowVersion: FlowVersion, request: UpdateTriggerRequest): FlowVersion {
    const existingSteps = flowVersion.trigger.steps ?? []
    const updatedTrigger = createTrigger(request.name, request, existingSteps)
    const clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    clonedVersion.trigger = updatedTrigger
    return clonedVersion
}

export const triggerOperations = { update }
