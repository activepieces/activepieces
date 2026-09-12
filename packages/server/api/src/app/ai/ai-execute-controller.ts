import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil } from '@activepieces/core-utils'
import { AiStepAction, AiStepFile, AiStepSchema, AiStepWebSearch, EngineResponseStatus, LATEST_JOB_DATA_SCHEMA_VERSION, maxSocketHttpBufferSizeBytes, PrincipalType, spreadIfDefined, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { assertCreditsAndAppSumoNotExceeded } from '../platform/billing-provider'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { jobQueue, JobType } from '../workers/job-queue/job-queue'

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
        const { action, provider, providerConfigId, modelId, prompt, text, categories, files, schema, advancedOptions, conversation, maxOutputTokens, temperature, webSearch, flowId, flowRunId, waitpointId } = request.body
        await assertCreditsAndAppSumoNotExceeded({ platformId: platform.id, log: request.log })

        const requestId = apId()
        const log = request.log.child({ flowRun: { id: flowRunId }, requestId })
        const answerInThisRequest = isNil(waitpointId)
        const answer = answerInThisRequest ? listenForWorkerAnswer({ requestId, log }) : undefined

        await jobQueue(log).add({
            id: apId(),
            type: JobType.ONE_TIME,
            data: {
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                jobType: WorkerJobType.EXECUTE_AI,
                requestId,
                projectId,
                platformId: platform.id,
                flowId,
                flowRunId,
                ...spreadIfDefined('waitpointId', waitpointId),
                ...spreadIfDefined('webserverId', answerInThisRequest ? engineResponseWatcher(log).getServerId() : undefined),
                action,
                provider,
                modelId,
                ...spreadIfDefined('prompt', prompt),
                ...spreadIfDefined('providerConfigId', providerConfigId),
                ...spreadIfDefined('text', text),
                ...spreadIfDefined('categories', categories),
                ...spreadIfDefined('files', files),
                ...spreadIfDefined('schema', schema),
                ...spreadIfDefined('advancedOptions', advancedOptions),
                ...spreadIfDefined('conversation', conversation),
                ...spreadIfDefined('maxOutputTokens', maxOutputTokens),
                ...spreadIfDefined('temperature', temperature),
                ...spreadIfDefined('webSearch', webSearch),
            },
        })

        if (!isNil(answer)) {
            return reply.status(StatusCodes.OK).send({ requestId, ...await answer })
        }

        log.info({ project: { id: projectId } }, '[aiExecuteController] Enqueued AI step')
        return reply.status(StatusCodes.OK).send({ requestId })
    })
}

async function listenForWorkerAnswer({ requestId, log }: { requestId: string, log: FastifyBaseLogger }): Promise<{ output?: unknown, failure?: string }> {
    const timeoutMs = system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS) * 1000
    const response = await engineResponseWatcher(log).oneTimeListener<WorkerResponse | undefined>(requestId, true, timeoutMs, undefined)
    if (isNil(response)) {
        return { failure: 'The AI step did not finish in time' }
    }
    if (response.status !== EngineResponseStatus.OK) {
        return { failure: response.error ?? 'The AI step failed' }
    }
    return response.response ?? { failure: 'The AI step reported nothing back' }
}

const RUN_PRINCIPALS = [PrincipalType.ENGINE] as const

const ExecuteAiRequest = z.object({
    action: AiStepAction,
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

type WorkerResponse = {
    status: EngineResponseStatus
    response?: { output?: unknown, failure?: string }
    error?: string
}
