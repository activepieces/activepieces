import { apId, FlowId, FlowVersionId, isNil, ProjectId, stringifyNullOrUndefined } from '@activepieces/core-utils'
import { DATA_TYPE_KEY_IN_FILE_METADATA, FileCompression, FileType, FlowAction, FlowActionType, flowStructureUtil, FlowTrigger, FlowVersion, SampleDataDataType, SampleDataFileType, SampleDataSettings, SaveSampleDataResponse, Step } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { fileRepo, fileService } from '../../file/file.service'
import { flowVersionService } from '../flow-version/flow-version.service'
export const sampleDataService = (log: FastifyBaseLogger) => ({
    async saveSampleDataFileIdsInStep(params: SaveSampleDataParams): Promise<SampleDataSettings> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(params.flowVersionId)
        const step = flowStructureUtil.getStepOrThrow(params.stepName, flowVersion.trigger)
        const sampleDataFile = await saveSampleData(params, log)
        const clonedStep: Step = JSON.parse(JSON.stringify(step))
        return {
            sampleDataFileId: params.type === SampleDataFileType.OUTPUT ? sampleDataFile.id : clonedStep.settings.sampleData?.sampleDataFileId,
            sampleDataInputFileId: params.type === SampleDataFileType.INPUT ? sampleDataFile.id : clonedStep.settings.sampleData?.sampleDataInputFileId,
            lastTestDate: dayjs().toISOString(),
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
    async getSampleDataForFlow({ projectId, flowVersion, type, referencedBy }: GetSampleDataForFlowParams): Promise<Record<string, unknown>> {
        const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        const steps = isNil(referencedBy) ? allSteps : selectReferencedSteps({ steps: allSteps, referencedBy })
        return Object.fromEntries(await Promise.all(steps.map(async (step) => [
            step.name,
            await this.getOrReturnEmpty({ projectId, flowVersion, stepName: step.name, type }),
        ])))
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

function selectReferencedSteps({ steps, referencedBy }: SelectReferencedStepsParams): Step[] {
    const referenced: Step[] = []
    let references = isNil(referencedBy) ? '' : JSON.stringify(referencedBy)
    for (const step of [...steps].reverse()) {
        if (!references.includes(step.name)) {
            continue
        }
        referenced.push(step)
        if (step.type === FlowActionType.LOOP_ON_ITEMS) {
            references += JSON.stringify(step.settings)
        }
    }
    return referenced.reverse()
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


type SelectReferencedStepsParams = {
    steps: Step[]
    referencedBy: unknown
}

type GetSampleDataForFlowParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    type: SampleDataFileType
    referencedBy?: unknown
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
