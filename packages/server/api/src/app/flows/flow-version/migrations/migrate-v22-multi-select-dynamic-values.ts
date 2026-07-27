import { isNil } from '@activepieces/core-utils'
import { piecePropertiesUtils } from '@activepieces/pieces-framework'
import { FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion, PropertyExecutionType, PropertySettings } from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../../project/project-service'
import { flowService } from '../../flow/flow.service'
import { Migration } from '.'

export const migrateV22MultiSelectDynamicValues: Migration = {
    targetSchemaVersion: '22',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const log = system.globalLogger()
        const flow = await flowService(log).getOneById(flowVersion.flowId)
        const platformId = isNil(flow)
            ? undefined
            : await projectService(log).getPlatformId(flow.projectId)

        const recoveredValuesByStepName: Record<string, Record<string, unknown>> = {}
        for (const step of flowStructureUtil.getAllSteps(flowVersion.trigger)) {
            if (step.type !== FlowActionType.PIECE && step.type !== FlowTriggerType.PIECE) {
                continue
            }
            const input: Record<string, unknown> = step.settings.input ?? {}
            const dynamicStringKeys = Object.entries(step.settings.propertySettings ?? {})
                .filter(([key, setting]) => setting.type === PropertyExecutionType.DYNAMIC && typeof input[key] === 'string')
                .map(([key]) => key)
            if (dynamicStringKeys.length === 0) {
                continue
            }
            const pieceMetadata = await pieceMetadataService(log).get({
                platformId,
                name: step.settings.pieceName,
                version: step.settings.pieceVersion,
            })
            const components = step.type === FlowActionType.PIECE ? pieceMetadata?.actions : pieceMetadata?.triggers
            const componentName = step.type === FlowActionType.PIECE ? step.settings.actionName : step.settings.triggerName
            if (isNil(components) || isNil(componentName)) {
                continue
            }
            const props = components[componentName]?.props
            if (isNil(props)) {
                continue
            }
            const recoveredValues = Object.fromEntries(dynamicStringKeys.flatMap((key) => {
                const property = props[key]
                if (isNil(property)) {
                    return []
                }
                const recoveredValue = piecePropertiesUtils.parseDynamicValue({ property, value: input[key] })
                return isNil(recoveredValue) ? [] : [[key, recoveredValue]]
            }))
            if (Object.keys(recoveredValues).length > 0) {
                recoveredValuesByStepName[step.name] = recoveredValues
            }
        }

        const newFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            const recoveredValues = recoveredValuesByStepName[step.name]
            if (isNil(recoveredValues)) {
                return step
            }
            const input: Record<string, unknown> = step.settings.input ?? {}
            const propertySettings: Record<string, PropertySettings> = step.settings.propertySettings ?? {}
            return {
                ...step,
                settings: {
                    ...step.settings,
                    input: { ...input, ...recoveredValues },
                    propertySettings: Object.fromEntries(
                        Object.entries(propertySettings).map(([key, setting]) => [
                            key,
                            key in recoveredValues ? { ...setting, type: PropertyExecutionType.MANUAL } : setting,
                        ]),
                    ),
                },
            }
        })

        return {
            ...newFlowVersion,
            schemaVersion: '23',
        }
    },
}
