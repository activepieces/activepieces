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
    SaveSampleDataResponse,
    StepRunResponse,
    Trigger,
} from '@activepieces/shared'
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
    }: RunActionParams): Promise<Omit<StepRunResponse, 'id'>> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
        const step = flowStructureUtil.getActionOrThrow(stepName, flowVersion.trigger)

        const { result, standardError, standardOutput } = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperActionResult>>({
            projectId,
            flowVersion,
            jobType: UserInteractionJobType.EXECUTE_ACTION,
            stepName: step.name,
            runEnvironment,
            sampleData: await this.getSampleDataForFlow(projectId, flowVersion, FileType.SAMPLE_DATA),
        })

        return {
            success: result.success,
            input: result.input,
            output: result.output,
            standardError,
            standardOutput,
        }
    },
    async save({
        projectId,
        flowVersionId,
        stepName,
        payload,
        fileType,
    }: SaveSampleDataParams): Promise<SaveSampleDataResponse> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
        const step = flowStructureUtil.getStepOrThrow(stepName, flowVersion.trigger)
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
    },
    async getOrReturnEmpty(params: GetSampleDataParams): Promise<unknown> {
        const step = flowStructureUtil.getStepOrThrow(params.stepName, params.flowVersion.trigger)
        const fileType = params.fileType
        const fileId = fileType === FileType.SAMPLE_DATA ? step.settings.inputUiInfo?.sampleDataFileId : step.settings.inputUiInfo?.sampleDataInputFileId
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
    async getSampleDataForFlow(projectId: ProjectId, flowVersion: FlowVersion, fileType: FileType): Promise<Record<string, unknown>> {
        const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        const sampleDataPromises = steps.map(async (step) => {
            const data = await this.getOrReturnEmpty({
                projectId,
                flowVersion,
                stepName: step.name,
                fileType,
            })
            return { [step.name]: data }
        })
        const sampleDataArray = await Promise.all(sampleDataPromises)
        return Object.assign({}, ...sampleDataArray)
    },
})

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
    fileType: FileType
    stepName: string
    flowVersion: FlowVersion
}

type SaveSampleDataParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
    payload: unknown
    fileType: FileType
}
type RunActionParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
    platformId: PlatformId
    runEnvironment: RunEnvironment
}
