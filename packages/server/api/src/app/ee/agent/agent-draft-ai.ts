import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, PlatformId, ProjectId, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { CHAT_BYOK_CREDIT_WEIGHT, DraftAgentResponse, isAppSumoCreditedPlan } from '@activepieces/shared'
import { generateText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { trackBillingAndSendTelemetry } from '../../platform/billing-and-telemetry'
import { CreditUsageSource } from '../../platform/billing-provider'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { agentHelpers } from './agent-helpers'

const DRAFT_TIMEOUT_MS = 30_000
const REPLY_LOG_LIMIT = 500
const FAST_TIER_ID = 'fast'
const DRAFT_SYSTEM_PROMPT = readFileSync(path.resolve('packages/server/api/src/assets/prompts/agent-draft-prompt.md'), 'utf8')

export const agentDraftAi = (log: FastifyBaseLogger) => ({
    async draft({ platformId, projectId, prompt }: DraftParams): Promise<DraftAgentResponse> {
        const { data: resolved, error: modelError } = await tryCatch(() => agentHelpers.resolveFastModelWithId({ platformId, log }))
        if (!isNil(modelError) || isNil(resolved)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Connect an AI provider before drafting an agent, or start from a starter agent instead' },
            })
        }
        const { model, modelId, provider } = resolved

        const { data: raw, error: generateError } = await tryCatch(async () => {
            const { text } = await generateText({
                model,
                instructions: DRAFT_SYSTEM_PROMPT,
                prompt,
                telemetry: agentAiUtils.buildTelemetry({ functionId: 'agent-draft' }),
                abortSignal: AbortSignal.timeout(DRAFT_TIMEOUT_MS),
            })
            return text
        })
        if (!isNil(generateError) || isNil(raw)) {
            const reason = describeError(generateError)
            log.error({ error: generateError, reason, provider, model: { id: modelId }, platform: { id: platformId } }, '[agentDraftAi] The model call failed while drafting an agent')
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `The ${provider} provider could not run ${modelId}: ${reason}` },
            })
        }

        const parsed = parseDraft(raw)
        if (isNil(parsed)) {
            log.error({ platform: { id: platformId }, reply: raw.slice(0, REPLY_LOG_LIMIT) }, '[agentDraftAi] The model replied with something that is not a draft')
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Could not draft an agent from that description, try rewording it' },
            })
        }
        await debitDraft({ platformId, projectId, log })
        return parsed
    },
})

// The telemetry sink renders the SDK's wrapped provider failure as "[object Object]".
function describeError(error: unknown): string {
    if (!(error instanceof Error)) {
        return String(error)
    }
    const parts = [error.message]
    const cause = (error as { cause?: unknown }).cause
    if (cause instanceof Error) {
        parts.push(cause.message)
    }
    return parts.filter((part) => part.length > 0).join(' | ')
}

function parseDraft(raw: string): DraftAgentResponse | null {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) {
        return null
    }
    const { data: json, error } = tryCatchSync(() => JSON.parse(raw.slice(start, end + 1)))
    if (!isNil(error)) {
        return null
    }
    const parsed = DraftAgentResponse.safeParse(json)
    return parsed.success ? parsed.data : null
}

async function debitDraft({ platformId, projectId, log }: { platformId: PlatformId, projectId: ProjectId, log: FastifyBaseLogger }): Promise<void> {
    const { error } = await tryCatch(async () => {
        const provider = await agentHelpers.resolveChatProviderName({ platformId, log })
        const value = provider === AIProviderName.ACTIVEPIECES ? agentHelpers.resolveTier({ tierId: FAST_TIER_ID }).creditWeight : CHAT_BYOK_CREDIT_WEIGHT
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const usage = {
            platformId,
            value,
            source: CreditUsageSource.AGENT_DRAFT as const,
            idempotencyKey: `agent-draft:${apId()}`,
            properties: { platformId, projectId, provider },
        }
        await trackBillingAndSendTelemetry({
            log,
            licenseKey: platformPlan.licenseKey,
            credits: usage,
            ...(isAppSumoCreditedPlan(platformPlan.plan) ? { appSumo: { ...usage, idempotencyKey: `agent-draft-appsumo:${apId()}` } } : {}),
        })
    })
    if (!isNil(error)) {
        log.warn({ error, platform: { id: platformId } }, '[agentDraftAi] Draft usage was not recorded')
    }
}

type DraftParams = {
    platformId: PlatformId
    projectId: ProjectId
    prompt: string
}
