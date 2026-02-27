import { TypeCompiler } from '@sinclair/typebox/compiler'
import { isNil } from '../../../core/common'
import { FlowVersion } from '../flow-version'
import { FlowTrigger } from '../triggers/trigger'
import { UpdateTriggerRequest } from './index'

const triggerSchemaValidation = TypeCompiler.Compile(FlowTrigger)

export const triggerOperations = {
    update(flowVersion: FlowVersion, request: UpdateTriggerRequest): FlowVersion {
        const trigger: FlowTrigger = {
            displayName: request.displayName,
            name: request.name,
            valid: false,
            steps: flowVersion.trigger.steps ?? [],
            type: request.type,
            settings: request.settings,
        }
        const valid = (isNil(request.valid) ? true : request.valid) && triggerSchemaValidation.Check(trigger)
        const clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
        clonedVersion.trigger = {
            ...trigger,
            valid,
        }
        return clonedVersion
    },
}
