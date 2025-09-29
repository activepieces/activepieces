import {
    apId,
    DATA_TYPE_KEY_IN_FILE_METADATA,
    FileCompression,
    FileType,
    FlowAction,
    FlowId,
    flowStructureUtil,
    FlowTrigger,
    FlowVersion,
    FlowVersionId,
    isNil,
    ProjectId,
    SampleDataDataType,
    SampleDataFileType,
    SaveSampleDataResponse,
    Step,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { fileRepo, fileService } from '../../file/file.service'
import { flowVersionService } from '../flow-version/flow-version.service'
export const sampleDataService = (log: FastifyBaseLogger) => ({
    async saveSampleDataFileIdsInStep(params: SaveSampleDataParams): Promise<Step> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(params.flowVersionId)
        const step = flowStructureUtil.getStepOrThrow(params.stepName, flowVersion.trigger)
        const sampleDataFile = await saveSampleData(params, log)
        const clonedStep: Step = JSON.parse(JSON.stringify(step))
        return {
            ...clonedStep,
            settings: {
                ...clonedStep.settings,
                sampleData: {
                    ...clonedStep.settings.sampleData,
                    sampleDataFileId: params.type === SampleDataFileType.OUTPUT ? sampleDataFile.id : clonedStep.settings.sampleData?.sampleDataFileId,
                    sampleDataInputFileId: params.type === SampleDataFileType.INPUT ? sampleDataFile.id : clonedStep.settings.sampleData?.sampleDataInputFileId,
                    lastTestDate: dayjs().toISOString(),
                },
            },
        }
    },
    async getOrReturnEmpty(params: GetSampleDataParams): Promise<unknown> {
        const step = flowStructureUtil.getStepOrThrow(params.stepName, params.flowVersion.trigger)
        const fileType = params.type === SampleDataFileType.INPUT ? FileType.SAMPLE_DATA_INPUT : FileType.SAMPLE_DATA
        const fileId = params.type === SampleDataFileType.OUTPUT ? step.settings.sampleData?.sampleDataFileId : step.settings.sampleData?.sampleDataInputFileId
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
            return JSON.parse(response.data.toString('utf-8'))
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
        const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        const sampleDataPromises = steps.map(async (step) => {
            const data = await this.getOrReturnEmpty({
                projectId,
                flowVersion,
                stepName: step.name,
                type,
            })
            return { [step.name]: data }
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
    dataType,
}: SaveSampleDataParams, log: FastifyBaseLogger): Promise<SaveSampleDataResponse> {
    const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
    const step = flowStructureUtil.getStepOrThrow(stepName, flowVersion.trigger)
    const fileType = type === SampleDataFileType.INPUT ? FileType.SAMPLE_DATA_INPUT : FileType.SAMPLE_DATA
    const fileId = await useExistingOrCreateNewSampleId(projectId, flowVersion, step, fileType, log)
    const data = Buffer.from(JSON.stringify(payload))
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
            [DATA_TYPE_KEY_IN_FILE_METADATA]: dataType,
        },
    })
}

async function useExistingOrCreateNewSampleId(projectId: ProjectId, flowVersion: FlowVersion, step: FlowAction | FlowTrigger, fileType: FileType, log: FastifyBaseLogger): Promise<string> {
    const sampleDataId = fileType === FileType.SAMPLE_DATA ? step.settings.sampleData?.sampleDataFileId : step.settings.sampleData?.sampleDataInputFileId
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
    dataType: SampleDataDataType
}
