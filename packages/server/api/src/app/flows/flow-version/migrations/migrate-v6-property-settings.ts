import { FlowVersion, PropertyExecutionType } from '@activepieces/shared'
import { Migration } from '.'
import { legacyFlowStructureUtil } from './legacy-flow-structure-util'

export const migratePropertySettingsV6: Migration = {
    targetSchemaVersion: '6',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = legacyFlowStructureUtil.transferFlow(flowVersion, (step) => {
            const input = step.settings?.input ?? {}
            const sampleDataFileId = step.settings?.inputUiInfo?.sampleDataFileId
            const sampleDataInputFileId = step.settings?.inputUiInfo?.sampleDataInputFileId
            const lastTestDate = step.settings?.inputUiInfo?.lastTestDate
            const schema = step.settings?.schema
            const customLogoUrl = step.settings?.inputUiInfo?.customizedInputs?.logoUrl ?? (('customLogoUrl' in step && step.customLogoUrl) ? step.customLogoUrl : undefined)
            const customizedInputs = step.settings?.inputUiInfo?.customizedInputs ?? {}
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