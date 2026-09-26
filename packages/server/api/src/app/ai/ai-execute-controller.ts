import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil } from '@activepieces/core-utils'
import { AiStepAction, AiStepFile, AiStepSchema, AiStepWebSearch, ExecuteAiJobData, LATEST_JOB_DATA_SCHEMA_VERSION, maxSocketHttpBufferSizeBytes, PrincipalType, WorkerJobType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { assertCreditsAndAppSumoNotExceeded } from '../platform/billing-provider'
import { aiExecution } from './ai-execution'
import { aiModelResolution } from './ai-model-resolution'

export const aiExecuteController: FastifyPluginAsyncZod = async (app) => {
    const bodyLimit = maxSocketHttpBufferSizeBytes(system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB))

    app.post('/execute', { ...ExecuteAiRoute, bodyLimit }, async (request, reply) => {
        if (request.principal.type !== PrincipalType.ENGINE) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: { message: 'Only a running flow can start an AI step' },
            })
        }
        const { projectId, platform } = request.principal
        const body = request.body
        await assertCreditsAndAppSumoNotExceeded({ platformId: platform.id, log: request.log })

        const requestId = apId()
        const log = request.log.child({ flowRun: { id: body.flowRunId }, requestId })
        const execution = aiExecution(log)
        const answerInThisRequest = isNil(body.waitpointId)
        const timeoutMs = system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS) * 1000
        const answer = answerInThisRequest ? execution.waitForAnswer({ requestId, timeoutMs }) : undefined

        const modelId = aiModelResolution.resolveTierModelId({ provider: body.provider, modelId: body.modelId })
        await execution.enqueue(aiJobFor({
            body,
            modelId,
            requestId,
            projectId,
            platformId: platform.id,
            webserverId: answerInThisRequest ? execution.serverId() : undefined,
        }))

        if (!isNil(answer)) {
            return reply.status(StatusCodes.OK).send({ requestId, ...await answer })
        }

        log.info({ project: { id: projectId }, model: { requested: body.modelId, resolved: modelId } }, '[aiExecuteController] Enqueued AI step')
        return reply.status(StatusCodes.OK).send({ requestId })
    })
}

function aiJobFor({ body, modelId, requestId, projectId, platformId, webserverId }: {
    body: z.infer<typeof ExecuteAiRequest>
    modelId: string
    requestId: string
    projectId: string
    platformId: string
    webserverId?: string
}): ExecuteAiJobData {
    const shared = {
        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
        jobType: WorkerJobType.EXECUTE_AI,
        requestId,
        projectId,
        platformId,
        flowId: body.flowId,
        flowRunId: body.flowRunId,
        waitpointId: body.waitpointId,
        webserverId,
        provider: body.provider,
        modelId,
        prompt: body.prompt,
        providerConfigId: body.providerConfigId,
        maxOutputTokens: body.maxOutputTokens,
        temperature: body.temperature,
        webSearch: body.webSearch,
    } as const

    switch (body.action) {
        case AiStepAction.ASK_AI:
            return { ...shared, action: AiStepAction.ASK_AI, conversation: body.conversation }
        case AiStepAction.SUMMARIZE_TEXT:
            return { ...shared, action: AiStepAction.SUMMARIZE_TEXT, text: body.text }
        case AiStepAction.CLASSIFY_TEXT:
            return {
                ...shared,
                action: AiStepAction.CLASSIFY_TEXT,
                text: body.text,
                categories: body.categories,
            }
        case AiStepAction.EXTRACT_STRUCTURED_DATA:
            return {
                ...shared,
                action: AiStepAction.EXTRACT_STRUCTURED_DATA,
                text: body.text,
                files: body.files,
                schema: body.schema,
            }
        case AiStepAction.GENERATE_IMAGE:
            return {
                ...shared,
                action: AiStepAction.GENERATE_IMAGE,
                files: body.files,
                advancedOptions: body.advancedOptions,
            }
    }
}

const RUN_PRINCIPALS = [PrincipalType.ENGINE] as const

const ExecuteAiRequest = z.object({
    action: z.enum(AiStepAction).exclude(['ROUTE']),
    flowId: z.string(),
    flowRunId: z.string(),
    waitpointId: z.string().optional(),
    provider: z.enum(AIProviderName),
    providerConfigId: z.string().optional(),
    modelId: z.string(),
    prompt: z.string().optional(),
    text: z.string().optional(),
    categories: z.array(z.string()).optional(),
    files: z.array(AiStepFile).optional(),
    schema: AiStepSchema.optional(),
    advancedOptions: z.record(z.string(), z.unknown()).optional(),
    conversation: z.array(z.record(z.string(), z.unknown())).optional(),
    maxOutputTokens: z.number().optional(),
    temperature: z.number().optional(),
    webSearch: AiStepWebSearch.optional(),
})

const ExecuteAiResponse = z.object({
    requestId: z.string(),
    output: z.unknown().optional(),
    failure: z.string().optional(),
})

const ExecuteAiRoute = {
    config: {
        security: securityAccess.publicPlatform(RUN_PRINCIPALS),
    },
    schema: {
        tags: ['ai'],
        body: ExecuteAiRequest,
        response: { [StatusCodes.OK]: ExecuteAiResponse },
    },
}
