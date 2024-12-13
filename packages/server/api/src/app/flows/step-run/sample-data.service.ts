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
    }: RunActionParams): Promise<Omit<StepRunResponse, 'id'>> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
        const step = flowStructureUtil.getActionOrThrow(stepName, flowVersion.trigger)

        const { result, standardError, standardOutput } = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperActionResult>>({
            projectId,
            flowVersion,
            jobType: UserInteractionJobType.EXECUTE_ACTION,
            stepName: step.name,
            sampleData: await this.getSampleDataForFlow(projectId, flowVersion),
        })

        return {
            success: result.success,
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
    }: SaveSampleDataParams): Promise<SaveSampleDataResponse> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
        const step = flowStructureUtil.getStepOrThrow(stepName, flowVersion.trigger)
        const fileId = await useExistingOrCreateNewSampleId(projectId, flowVersion, step, log)
        const data = Buffer.from(JSON.stringify(payload))
        return fileService(log).save({
            projectId,
            fileId,
            data,
            size: data.length,
            type: FileType.SAMPLE_DATA,
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
        const sampleDataFileId = step.settings.inputUiInfo?.sampleDataFileId
        const currentSelectedData = step.settings.inputUiInfo?.currentSelectedData
        if (isNil(currentSelectedData) && isNil(sampleDataFileId)) {
            return {}
        }
        if (!isNil(sampleDataFileId)) {
            const { data } = await fileService(log).getDataOrThrow({
                projectId: params.projectId,
                fileId: sampleDataFileId,
                type: FileType.SAMPLE_DATA,
            })
            return JSON.parse(data.toString('utf-8'))
        }
        return currentSelectedData

    },
    async deleteForStep(params: DeleteSampleDataForStepParams): Promise<void> {
        await fileRepo().createQueryBuilder().delete().where({
            id: params.sampleDataFileId,
            projectId: params.projectId,
            type: FileType.SAMPLE_DATA,
        }).andWhere('metadata->>\'flowVersionId\' = :flowVersionId', { flowVersionId: params.flowVersionId }).execute()
    },
    async deleteForFlow(params: DeleteSampleDataParams): Promise<void> {
        await fileRepo().createQueryBuilder().delete().where({
            projectId: params.projectId,
            type: FileType.SAMPLE_DATA,
        }).andWhere('metadata->>\'flowId\' = :flowId', { flowId: params.flowId }).execute()
    },
    async getSampleDataForFlow(projectId: ProjectId, flowVersion: FlowVersion): Promise<Record<string, unknown>> {
        const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        const sampleDataPromises = steps.map(async (step) => {
            const data = await this.getOrReturnEmpty({
                projectId,
                flowVersion,
                stepName: step.name,
            })
            return { [step.name]: data }
        })
        const sampleDataArray = await Promise.all(sampleDataPromises)
        return Object.assign({}, ...sampleDataArray)
    },
})

async function useExistingOrCreateNewSampleId(projectId: ProjectId, flowVersion: FlowVersion, step: Action | Trigger, log: FastifyBaseLogger): Promise<string> {
    const sampleDataId = step.settings.inputUiInfo?.sampleDataFileId
    if (isNil(sampleDataId)) {
        return apId()
    }
    const file = await fileService(log).getFileOrThrow({
        projectId,
        fileId: sampleDataId,
        type: FileType.SAMPLE_DATA,
    })
    const isNewVersion = file.metadata?.flowVersionId !== flowVersion.id
    if (isNewVersion) {
        return apId()
    }
    return file.id
}


type DeleteSampleDataForStepParams = {
    projectId: ProjectId
    sampleDataFileId: string
    flowVersionId: FlowVersionId
    flowId: FlowId
}

type DeleteSampleDataParams = {
    projectId: ProjectId
    flowId: FlowId
}

type GetSampleDataParams = {
    projectId: ProjectId
    stepName: string
    flowVersion: FlowVersion
}

type SaveSampleDataParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
    payload: unknown
}
type RunActionParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
    platformId: PlatformId
}
