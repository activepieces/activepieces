import { FlowVersion, PropertyExecutionType } from '@activepieces/shared'
import { legacyFlowStructureUtil } from './legacy-flow-structure-util'
import { Migration } from '.'

export const migratePropertySettingsV6: Migration = {
    targetSchemaVersion: '6',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = legacyFlowStructureUtil.transferFlow(flowVersion, (step) => {
            const input = step.settings?.input ?? {}
            const inputUiInfo = step.settings?.inputUiInfo as Record<string, unknown> | undefined
            const sampleDataFileId = inputUiInfo?.sampleDataFileId
            const sampleDataInputFileId = inputUiInfo?.sampleDataInputFileId
            const lastTestDate = inputUiInfo?.lastTestDate
            const schema = step.settings?.schema as Record<string, unknown> | undefined
            const customizedInputs = (inputUiInfo?.customizedInputs ?? {}) as Record<string, unknown>
            const customLogoUrl = customizedInputs?.logoUrl ?? (step.customLogoUrl ? step.customLogoUrl : undefined)
            return {
                ...step,
                settings: {
                    ...step.settings,
                    customLogoUrl,
                    sampleDataSettings: {
                        sampleDataFileId,
                        sampleDataInputFileId,
                        lastTestDate,
                    },
                    propertySettings: Object.fromEntries(Object.entries(input).map(([key]) => [key, {
                        type: customizedInputs?.[key] ? PropertyExecutionType.DYNAMIC : PropertyExecutionType.MANUAL,
                        schema: schema?.[key] ?? undefined,
                    }])),
                    inputUiInfo: undefined,
                },
            }
        })
        return {
            ...newVersion,
            schemaVersion: '7',
        }
    },
}