import {
    DATA_TYPE_KEY_IN_FILE_METADATA,
    FileCompression,
    FileType,
    flowStructureUtil,
    FlowVersion,
    PropertyExecutionType,
    SampleDataDataType,
} from '@activepieces/shared'
import { fileService } from '../../../file/file.service'
import { Migration, MigrationContext } from '.'

export const migratePropertySettingsV6: Migration = {
    targetSchemaVersion: '6',
    migrate: async (flowVersion: FlowVersion, context?: MigrationContext): Promise<FlowVersion> => {
        const sampleDataFileIds = await uploadPendingSampleData(flowVersion, context)

        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            const input = step.settings?.input ?? {}
            const inputUiInfo = step.settings?.inputUiInfo
            const sampleDataFileId = sampleDataFileIds.get(step.name) ?? inputUiInfo?.sampleDataFileId
            const sampleDataInputFileId = inputUiInfo?.sampleDataInputFileId
            const lastTestDate = inputUiInfo?.lastTestDate
            const schema = step.settings?.schema
            const customLogoUrl = inputUiInfo?.customizedInputs?.logoUrl ?? (('customLogoUrl' in step && step.customLogoUrl) ? step.customLogoUrl : undefined)
            const customizedInputs = inputUiInfo?.customizedInputs ?? {}
            return {
                ...step,
                settings: {
                    ...step.settings,
                    customLogoUrl,
                    sampleData: {
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

async function uploadPendingSampleData(
    flowVersion: FlowVersion,
    context?: MigrationContext,
): Promise<Map<string, string>> {
    const fileIdMap = new Map<string, string>()
    if (!context) {
        return fileIdMap
    }
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    for (const step of steps) {
        const inputUiInfo = step.settings?.inputUiInfo
        if (!inputUiInfo) {
            continue
        }
        const currentSelectedData = inputUiInfo.currentSelectedData
        if (currentSelectedData === undefined || currentSelectedData === null) {
            continue
        }
        const outputJson = typeof currentSelectedData === 'string'
            ? currentSelectedData
            : JSON.stringify(currentSelectedData)
        const outputBuffer = Buffer.from(outputJson, 'utf-8')
        const dataType = typeof currentSelectedData === 'string'
            ? SampleDataDataType.STRING
            : SampleDataDataType.JSON

        const file = await fileService(context.log).save({
            projectId: context.projectId,
            data: outputBuffer,
            size: outputBuffer.length,
            type: FileType.SAMPLE_DATA,
            compression: FileCompression.NONE,
            metadata: {
                flowId: flowVersion.flowId,
                flowVersionId: flowVersion.id,
                stepName: step.name,
                [DATA_TYPE_KEY_IN_FILE_METADATA]: dataType,
            },
        })
        fileIdMap.set(step.name, file.id)
    }
    return fileIdMap
}
