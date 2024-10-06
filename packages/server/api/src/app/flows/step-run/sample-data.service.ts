import {
    ActivepiecesError,
    ErrorCode,
    FileCompression,
    FileType,
    flowHelper,
    FlowVersionId,
    isNil,
    File,
    ProjectId,
    StepRunResponse,
    FlowVersion,
    Action,
    Trigger,
    apId,
} from '@activepieces/shared'
import { engineRunner } from 'server-worker'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { flowVersionService } from '../flow-version/flow-version.service'
import { fileService } from '../../file/file.service'

export const sampleDataService = {
    async runAction({
        projectId,
        flowVersionId,
        stepName,
    }: RunActionParams): Promise<Omit<StepRunResponse, 'id'>> {
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const step = flowHelper.getStep(flowVersion, stepName)

        if (isNil(step) || !flowHelper.isAction(step.type)) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    stepName,
                },
            })
        }
        const engineToken = await accessTokenManager.generateEngineToken({
            projectId,
        })

        const { result, standardError, standardOutput } =
            await engineRunner.executeAction(engineToken, {
                stepName,
                flowVersion,
                projectId,
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
    }: SaveSampleDataParams): Promise<File> {
        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const step = flowHelper.getStep(flowVersion, stepName)

        if (isNil(step)) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    stepName,
                },
            })
        }
        const fileId = await findSampleDataId(projectId, flowVersion, step)
        return fileService.save({
            projectId,
            fileId,
            data: Buffer.from(JSON.stringify(payload)),
            type: FileType.SAMPLE_DATA,
            compression: FileCompression.NONE,
            metadata: {
                flowId: flowVersion.flowId,
                flowVersionId,
                stepName,
            },
        })
    },
    async getOrThrow(params: GetSampleDataParams): Promise<File> {
        const file = await fileService.getFileOrThrow({
            projectId: params.projectId,
            fileId: params.id,
            type: FileType.SAMPLE_DATA,
        })
        const { data } = await fileService.getDataOrThrow({
            projectId: params.projectId,
            fileId: params.id,
            type: FileType.SAMPLE_DATA,
        })
        return {
            ...file,
            data: JSON.parse(data.toString('utf-8'))
        }
    },
}

async function findSampleDataId(projectId: ProjectId, flowVersion: FlowVersion, step: Action | Trigger): Promise<string> {
    const sampleDataId = step.settings.inputUiInfo?.sampleDataFileId
    if (isNil(sampleDataId)) {
        return apId()
    }
    const file = await fileService.getFileOrThrow({
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

type GetSampleDataParams = {
    projectId: ProjectId
    id: string
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
}
