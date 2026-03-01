import {
    apId,
    DATA_TYPE_KEY_IN_FILE_METADATA,
    FileCompression,
    FileType,
    FlowGraphNode,
    FlowId,
    flowStructureUtil,
    FlowVersion,
    FlowVersionId,
    isNil,
    ProjectId,
    SampleDataDataType,
    SampleDataFileType,
    SaveSampleDataResponse,
    stringifyNullOrUndefined,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { fileRepo, fileService } from '../../file/file.service'
import { flowVersionService } from '../flow-version/flow-version.service'
export const sampleDataService = (log: FastifyBaseLogger) => ({
    async saveSampleDataFileIdsInStep(params: SaveSampleDataParams): Promise<FlowGraphNode> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(params.flowVersionId)
        const step = flowStructureUtil.getStepOrThrow(params.stepName, flowVersion)
        const sampleDataFile = await saveSampleData(params, log)
        const clonedStep: FlowGraphNode = JSON.parse(JSON.stringify(step))
        const settings = clonedStep.data.settings as Record<string, unknown>
        const existingSampleData = settings.sampleData as Record<string, unknown> | undefined
        return {
            ...clonedStep,
            data: {
                ...clonedStep.data,
                settings: {
                    ...settings,
                    sampleData: {
                        ...existingSampleData,
                        sampleDataFileId: params.type === SampleDataFileType.OUTPUT ? sampleDataFile.id : existingSampleData?.sampleDataFileId,
                        sampleDataInputFileId: params.type === SampleDataFileType.INPUT ? sampleDataFile.id : existingSampleData?.sampleDataInputFileId,
                        lastTestDate: dayjs().toISOString(),
                    },
                },
            },
        } as FlowGraphNode
    },
    async getOrReturnEmpty(params: GetSampleDataParams): Promise<unknown> {
        const step = flowStructureUtil.getStepOrThrow(params.stepName, params.flowVersion)
        const fileType = params.type === SampleDataFileType.INPUT ? FileType.SAMPLE_DATA_INPUT : FileType.SAMPLE_DATA
        const stepSettings = step.data.settings as Record<string, Record<string, unknown>>
        const fileId = (params.type === SampleDataFileType.OUTPUT ? stepSettings.sampleData?.sampleDataFileId : stepSettings.sampleData?.sampleDataInputFileId) as string | undefined
        if (isNil(fileId)) {
            return {}
        }
        if (!isNil(fileId)) {
            const response = await fileService(log).getDataOrUndefined({
                projectId: params.projectId,
                fileId,
                type: fileType,
            })

            if (isNil(response)) {
                return undefined
            }
            if (response.metadata?.[DATA_TYPE_KEY_IN_FILE_METADATA] === SampleDataDataType.STRING) {
                return response.data.toString('utf-8')
            }
            const decodedData = new TextDecoder('utf-8').decode(response.data)
            return JSON.parse(decodedData)
        }
        return undefined

    },
    async deleteForStep(params: DeleteSampleDataForStepParams): Promise<void> {
        await fileRepo().createQueryBuilder().delete().where({
            id: params.fileId,
            projectId: params.projectId,
            type: params.fileType,
        }).andWhere('metadata->>\'flowVersionId\' = :flowVersionId', { flowVersionId: params.flowVersionId }).execute()
    },
    async deleteForFlow(params: DeleteSampleDataParams): Promise<void> {
        await fileRepo().createQueryBuilder().delete().where({
            projectId: params.projectId,
            type: params.fileType,
        }).andWhere('metadata->>\'flowId\' = :flowId', { flowId: params.flowId }).execute()
    },
    async getSampleDataForFlow(projectId: ProjectId, flowVersion: FlowVersion, type: SampleDataFileType): Promise<Record<string, unknown>> {
        const steps = flowStructureUtil.getAllSteps(flowVersion)
        const sampleDataPromises = steps.map(async (step) => {
            const data = await this.getOrReturnEmpty({
                projectId,
                flowVersion,
                stepName: step.id,
                type,
            })
            return { [step.id]: data }
        })
        const sampleDataArray = await Promise.all(sampleDataPromises)
        return Object.assign({}, ...sampleDataArray)
    },
})

export async function saveSampleData({
    projectId,
    flowVersionId,
    stepName,
    payload,
    type,
}: SaveSampleDataParams, log: FastifyBaseLogger): Promise<SaveSampleDataResponse> {
    const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
    const step = flowStructureUtil.getStepOrThrow(stepName, flowVersion)
    const fileType = type === SampleDataFileType.INPUT ? FileType.SAMPLE_DATA_INPUT : FileType.SAMPLE_DATA
    const fileId = await useExistingOrCreateNewSampleId(projectId, flowVersion, step, fileType, log)
    const payloadWithStringifiedNullOrUndefined = isNil(payload) ? stringifyNullOrUndefined(payload) : payload
    const data = typeof payloadWithStringifiedNullOrUndefined === 'string' ? Buffer.from(payloadWithStringifiedNullOrUndefined) : Buffer.from(JSON.stringify(payloadWithStringifiedNullOrUndefined))
    return fileService(log).save({
        projectId,
        fileId,
        data,
        size: data.length,
        type: fileType,
        compression: FileCompression.NONE,
        metadata: {
            flowId: flowVersion.flowId,
            flowVersionId,
            stepName,
            [DATA_TYPE_KEY_IN_FILE_METADATA]: typeof payloadWithStringifiedNullOrUndefined === 'string' ? SampleDataDataType.STRING : SampleDataDataType.JSON,
        },
    })
}

async function useExistingOrCreateNewSampleId(projectId: ProjectId, flowVersion: FlowVersion, step: FlowGraphNode, fileType: FileType, log: FastifyBaseLogger): Promise<string> {
    const stepSettings = step.data.settings as Record<string, Record<string, unknown>>
    const sampleDataId = (fileType === FileType.SAMPLE_DATA ? stepSettings.sampleData?.sampleDataFileId : stepSettings.sampleData?.sampleDataInputFileId) as string | undefined
    if (isNil(sampleDataId)) {
        return apId()
    }
    const file = await fileService(log).getFile({
        projectId,
        fileId: sampleDataId,
        type: fileType,
    })
    const isNewVersion = file?.metadata?.flowVersionId !== flowVersion.id
    if (isNewVersion || isNil(file)) {
        return apId()
    }
    return file.id
}


type DeleteSampleDataForStepParams = {
    projectId: ProjectId
    fileId: string
    fileType: FileType
    flowVersionId: FlowVersionId
    flowId: FlowId
}

type DeleteSampleDataParams = {
    projectId: ProjectId
    flowId: FlowId
    fileType: FileType
}

type GetSampleDataParams = {
    projectId: ProjectId
    type: SampleDataFileType
    stepName: string
    flowVersion: FlowVersion
}

type SaveSampleDataParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
    payload: unknown
    type: SampleDataFileType
}
