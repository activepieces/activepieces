import { ActivepiecesError, AIProviderName, ApId, apId, ErrorCode, isNil, spreadIfDefined } from '@activepieces/core-utils'
import { AiStepAction, AiStepFile, AiStepSchema, AiStepWebSearch, ExecuteAiJobData, LATEST_JOB_DATA_SCHEMA_VERSION, maxSocketHttpBufferSizeBytes, PrincipalType, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { assertCreditsAndAppSumoNotExceeded } from '../platform/billing-provider'
import { aiExecution } from './ai-execution'
import { aiModelCandidates } from './ai-model-candidates'
import { aiModelResolution } from './ai-model-resolution'
import { aiProviderService } from './ai-provider-service'

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
        const model = await pickModel({ body, platformId: platform.id, projectId, log })
        const answerInThisRequest = isNil(body.waitpointId)
        const timeoutMs = system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS) * 1000
        const answer = answerInThisRequest ? execution.waitForAnswer({ requestId, timeoutMs }) : undefined

        await execution.enqueue(aiJobFor({
            body,
            model,
            requestId,
            projectId,
            platformId: platform.id,
            webserverId: answerInThisRequest ? execution.serverId() : undefined,
        }))
        log.info({
            project: { id: projectId },
            model: { id: model.modelId },
            tier: isNil(body.modelTierId) && model.modelId !== body.modelId ? { id: body.modelId } : undefined,
            platformTier: isNil(body.modelTierId) ? undefined : { id: body.modelTierId },
        }, '[aiExecuteController] Enqueued AI step')

        if (!isNil(answer)) {
            return reply.status(StatusCodes.OK).send({ requestId, ...await answer })
        }
        return reply.status(StatusCodes.OK).send({ requestId })
    })
}

async function pickModel({ body, platformId, projectId, log }: {
    body: z.infer<typeof ExecuteAiRequest>
    platformId: string
    projectId: string
    log: FastifyBaseLogger
}): Promise<PickedModel> {
    if (!isNil(body.modelTierId)) {
        if (body.action === AiStepAction.GENERATE_IMAGE) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'Image steps pick a specific model, not a tier' } })
        }
        return aiModelCandidates(log).firstCandidate({ platformId, tierId: body.modelTierId, scope: { type: 'project', projectId } })
    }
    if (isNil(body.provider) || isNil(body.modelId)) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'Pick a tier or a provider and model' } })
    }
    const modelId = body.action === AiStepAction.GENERATE_IMAGE
        ? body.modelId
        : aiModelResolution.resolveTierModelId({ provider: body.provider, modelId: body.modelId, log })
    if (body.provider !== AIProviderName.ACTIVEPIECES) {
        await aiProviderService(log).assertModelAllowed({
            platformId,
            provider: body.provider,
            scope: { type: 'project', projectId },
            modelId,
            ...spreadIfDefined('configId', body.providerConfigId),
        })
    }
    return { provider: body.provider, providerConfigId: body.providerConfigId, modelId }
}

function aiJobFor({ body, model, requestId, projectId, platformId, webserverId }: {
    body: z.infer<typeof ExecuteAiRequest>
    model: PickedModel
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
        provider: model.provider,
        modelId: model.modelId,
        modelTierId: body.modelTierId,
        prompt: body.prompt,
        providerConfigId: model.providerConfigId,
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
    provider: z.enum(AIProviderName).optional(),
    providerConfigId: z.string().optional(),
    modelId: z.string().optional(),
    modelTierId: z.optional(ApId),
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

type PickedModel = {
    provider: AIProviderName
    providerConfigId?: string
    modelId: string
}

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
