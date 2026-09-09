import { ActivepiecesError, ErrorCode, isNil, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import { FileCompression, FileType, ResolveAiProviderRequest, ResolveAiProviderResponse, ResumeAiStepRequest, SaveAiFileRequest, SaveAiFileResponse, spreadIfDefined } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { fileService } from '../file/file.service'
import { filesService } from '../file/files-service'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { projectService } from '../project/project-service'
import { resumeService } from '../waitpoints/resume-service'
import { aiProviderService } from './ai-provider-service'

export const aiRpcHandlers = (log: FastifyBaseLogger) => ({
    async resolveAiProvider(input: ResolveAiProviderRequest): Promise<ResolveAiProviderResponse> {
        await assertProjectBelongsToPlatform({ ...input, log })
        const config = await aiProviderService(log).getConfigOrThrow({
            platformId: input.platformId,
            provider: input.provider,
            scope: { type: 'project', projectId: input.projectId },
            ...spreadIfDefined('configId', input.providerConfigId),
        })
        return {
            provider: config.provider,
            providerConfigId: config.configId,
            auth: config.auth as Record<string, unknown>,
            config: config.config as Record<string, unknown>,
        }
    },

    async saveAiFile(input: SaveAiFileRequest): Promise<SaveAiFileResponse> {
        await assertProjectBelongsToPlatform({ ...input, log })
        const maxFileSizeInBytes = system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB) * 1024 * 1024
        if (input.data.length > maxFileSizeInBytes) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `This AI step produced a ${Math.ceil(input.data.length / 1024 / 1024)}MB file, over the ${maxFileSizeInBytes / 1024 / 1024}MB limit` },
            })
        }
        const file = await fileService(log).save({
            projectId: input.projectId,
            platformId: input.platformId,
            data: input.data,
            size: input.data.length,
            type: FileType.FLOW_STEP_FILE,
            fileName: input.fileName,
            compression: FileCompression.NONE,
            metadata: { mimetype: input.mediaType },
        })
        const url = await filesService.constructReadUrl({
            fileId: file.id,
            fileType: file.type,
            platformId: input.platformId,
        })
        return { fileId: file.id, url }
    },

    async resumeAiStep(input: ResumeAiStepRequest): Promise<void> {
        const resumeFields = { flowRun: { id: input.flowRunId }, waitpoint: { id: input.waitpointId } }
        const flowRun = await flowRunService(log).getOne({ id: input.flowRunId, projectId: input.projectId })
        if (isNil(flowRun)) {
            log.warn(resumeFields, '[aiRpc#resumeAiStep] That flow run is gone from this project, so there is nothing left to resume')
            return
        }
        const { data: resumed, error } = await tryCatch(() => resumeService(log).resumeFromWaitpoint({
            flowRunId: flowRun.id,
            waitpointId: input.waitpointId,
            resumePayload: { body: sanitizeObjectForPostgresql(input.output), headers: {}, queryParams: {} },
        }))
        if (!isNil(error)) {
            if (!isFlowRunGone(error)) {
                throw error
            }
            log.warn(resumeFields, '[aiRpc#resumeAiStep] That flow run went away while resuming, so there is nothing left to resume')
            return
        }
        if (isNil(resumed) || resumed.stale) {
            log.warn(resumeFields, '[aiRpc#resumeAiStep] Nothing to resume, so the flow keeps waiting unless another attempt already released it')
            return
        }
        log.info(resumeFields, '[aiRpc#resumeAiStep] Handed the result back to the flow')
    },
})

async function assertProjectBelongsToPlatform({ projectId, platformId, log }: { projectId: string, platformId: string, log: FastifyBaseLogger }): Promise<void> {
    const project = await projectService(log).getOneOrThrow(projectId)
    if (project.platformId !== platformId) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: { message: 'That project does not belong to this platform' },
        })
    }
}

function isFlowRunGone(error: unknown): boolean {
    return error instanceof ActivepiecesError
        && error.error.code === ErrorCode.ENTITY_NOT_FOUND
        && error.error.params.entityType === FLOW_RUN_ENTITY_TYPE
}

const FLOW_RUN_ENTITY_TYPE = 'flow_run'
