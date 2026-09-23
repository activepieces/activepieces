import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { AiStepAction, ChooseAiRouteRequest, ChooseAiRouteResponse, LATEST_JOB_DATA_SCHEMA_VERSION, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { assertCreditsAndAppSumoNotExceeded } from '../platform/billing-provider'
import { aiExecution } from './ai-execution'
import { aiProviderService } from './ai-provider-service'

export const aiRouterService = (log: FastifyBaseLogger) => ({
    async choose({ platformId, projectId, ...request }: ChooseParams): Promise<ChooseAiRouteResponse> {
        const provider = await pickProvider({ platformId, projectId, log })
        await assertHasCredits({ platformId, log })

        const execution = aiExecution(log)
        const requestId = apId()
        const answer = execution.waitForAnswer({ requestId, timeoutMs: WAIT_MS })
        await execution.enqueue({
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            jobType: WorkerJobType.EXECUTE_AI,
            action: AiStepAction.ROUTE,
            requestId,
            webserverId: execution.serverId(),
            projectId,
            platformId,
            flowId: request.flowId,
            flowRunId: request.flowRunId,
            provider,
            modelId: AI_ROUTER_MODEL_ID,
            state: request.state,
            question: request.question,
            options: request.options,
            matchMode: request.matchMode,
        })

        const { output, failure } = await answer
        if (!isNil(failure)) {
            throw new ActivepiecesError({ code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message: failure } })
        }
        const parsed = ChooseAiRouteResponse.safeParse(output)
        if (!parsed.success) {
            throw new ActivepiecesError({ code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message: 'The routing model answered in a shape the AI Router does not understand' } })
        }
        log.info({ matched: parsed.data.matched, matchMode: request.matchMode, provider }, 'Chose the AI router routes')
        return parsed.data
    },
})

async function pickProvider({ platformId, projectId, log }: { platformId: string, projectId: string, log: FastifyBaseLogger }): Promise<AIProviderName> {
    const available = await aiProviderService(log).listForProject({ platformId, projectId })
    const provider = ROUTER_PROVIDERS.find((candidate) => available.some((entry) => entry.provider === candidate))
    if (isNil(provider)) {
        throw new ActivepiecesError({
            code: ErrorCode.FEATURE_DISABLED,
            params: { message: 'The AI Router needs an OpenRouter key. On Cloud that is the Activepieces provider; self-hosted, add OpenRouter under AI providers.' },
        })
    }
    return provider
}

async function assertHasCredits({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<void> {
    const { error } = await tryCatch(() => assertCreditsAndAppSumoNotExceeded({ platformId, log }))
    if (isNil(error)) {
        return
    }
    const details = error instanceof ActivepiecesError ? error.error : undefined
    if (isNil(details) || details.code !== ErrorCode.QUOTA_EXCEEDED) {
        log.warn({ error, platform: { id: platformId } }, '[aiRouterService] Credits check failed, allowing the call')
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: { ...details.params, message: OUT_OF_CREDITS_MESSAGE },
    })
}

const ROUTER_PROVIDERS = [AIProviderName.ACTIVEPIECES, AIProviderName.OPENROUTER] as const
const AI_ROUTER_MODEL_ID = 'typesafe/jev-1.13'
const WAIT_MS = 25_000
const OUT_OF_CREDITS_MESSAGE = 'The AI Router did not run because the platform is out of AI credits. Add credits or upgrade the plan, then retry the run.'

type ChooseParams = ChooseAiRouteRequest & {
    platformId: string
    projectId: string
}
