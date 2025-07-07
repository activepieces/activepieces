import { UserInteractionJobType } from '@activepieces/server-shared'
import {
    Action,
    apId,
    FileCompression,
    FileType,
    FlowId,
    flowStructureUtil,
    FlowVersion,
    FlowVersionId,
    isNil,
    PlatformId,
    ProjectId,
    RunEnvironment,
    SampleDataFileType,
    SaveSampleDataResponse,
    Step,
    StepRunResponse,
    Trigger,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperActionResult, EngineHelperResponse } from 'server-worker'
import { fileRepo, fileService } from '../../file/file.service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { flowVersionService } from '../flow-version/flow-version.service'

export const sampleDataService = (log: FastifyBaseLogger) => ({
    async runAction({
        projectId,
        flowVersionId,
        stepName,
        runEnvironment,
        requestId,
    }: RunActionParams): Promise<Omit<StepRunResponse, 'id'>> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
        const step = flowStructureUtil.getActionOrThrow(stepName, flowVersion.trigger)

        const { result, standardError, standardOutput } = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperActionResult>>({
            projectId,
            flowVersion,
            jobType: UserInteractionJobType.EXECUTE_ACTION,
            stepName: step.name,
            runEnvironment,
            sampleData: await this.getSampleDataForFlow(projectId, flowVersion, SampleDataFileType.OUTPUT),
        }, requestId)

        return {
            success: result.success,
            input: result.input,
            output: result.output,
            standardError,
            standardOutput,
        }
    },
    async modifyStep(params: SaveSampleDataParams): Promise<Step> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(params.flowVersionId)
        const step = flowStructureUtil.getStepOrThrow(params.stepName, flowVersion.trigger)
        const sampleDataFile = await saveSampleData(params, log)
        const clonedStep: Step = JSON.parse(JSON.stringify(step))
        return {
            ...clonedStep,
            settings: {
                ...clonedStep.settings,
                inputUiInfo: {
                    ...clonedStep.settings.inputUiInfo,
                    sampleDataFileId: params.type === SampleDataFileType.OUTPUT ? sampleDataFile.id : clonedStep.settings.inputUiInfo?.sampleDataFileId,
                    sampleDataInputFileId: params.type === SampleDataFileType.INPUT ? sampleDataFile.id : clonedStep.settings.inputUiInfo?.sampleDataInputFileId,
                    currentSelectedData: undefined,
                    lastTestDate: dayjs().toISOString(),
                },
            },
        }
    },
    async getOrReturnEmpty(params: GetSampleDataParams): Promise<unknown> {
        const step = flowStructureUtil.getStepOrThrow(params.stepName, params.flowVersion.trigger)
        const fileType = params.type === SampleDataFileType.INPUT ? FileType.SAMPLE_DATA_INPUT : FileType.SAMPLE_DATA
        const fileId = params.type === SampleDataFileType.OUTPUT ? step.settings.inputUiInfo?.sampleDataFileId : step.settings.inputUiInfo?.sampleDataInputFileId
        const currentSelectedData = step.settings.inputUiInfo?.currentSelectedData
        if (isNil(currentSelectedData) && isNil(fileId)) {
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
            return JSON.parse(response.data.toString('utf-8'))
        }
        if (fileType === FileType.SAMPLE_DATA_INPUT) {
            return undefined
        }
        return currentSelectedData

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
        },
    })
}

async function useExistingOrCreateNewSampleId(projectId: ProjectId, flowVersion: FlowVersion, step: Action | Trigger, fileType: FileType, log: FastifyBaseLogger): Promise<string> {
    const sampleDataId = fileType === FileType.SAMPLE_DATA ? step.settings.inputUiInfo?.sampleDataFileId : step.settings.inputUiInfo?.sampleDataInputFileId
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
type RunActionParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
    platformId: PlatformId
    runEnvironment: RunEnvironment
    requestId: string
}
