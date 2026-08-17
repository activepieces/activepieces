import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, PlatformId, ProjectId, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { CHAT_BYOK_CREDIT_WEIGHT, DEFAULT_CHAT_TIER_ID, DraftAgentResponse, isAppSumoCreditedPlan } from '@activepieces/shared'
import { APICallError, generateText, LanguageModel } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { trackBillingAndSendTelemetry } from '../../platform/billing-and-telemetry'
import { CreditUsageSource } from '../../platform/billing-provider'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { agentHelpers } from './agent-helpers'

const DRAFT_TIMEOUT_MS = 30_000
const REPLY_LOG_LIMIT = 500
const REASON_LIMIT = 200
const FAST_TIER_ID = 'fast'
const DRAFT_SYSTEM_PROMPT = readFileSync(path.resolve('packages/server/api/src/assets/prompts/agent-draft-prompt.md'), 'utf8')

export const agentDraftAi = (log: FastifyBaseLogger) => ({
    async draft({ platformId, projectId, prompt }: DraftParams): Promise<DraftAgentResponse> {
        const { data: resolved, error: modelError } = await tryCatch(() => agentHelpers.resolveTierModel({ platformId, tierId: FAST_TIER_ID, log }))
        if (!isNil(modelError) || isNil(resolved)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Connect an AI provider before drafting an agent, or start from a starter agent instead' },
            })
        }

        // Drafting asks for the cheap tier, which is a different model from the one chat runs on, so
        // an account that can serve one and not the other has working chat and failing drafts. A
        // refused key will refuse again, but anything else is worth one attempt on chat's own model.
        let attempt = await runDraft({ model: resolved.model, prompt })
        let usedModelId = resolved.modelId
        if (!isNil(attempt.error) && !rejectedCredentials(statusOf(attempt.error))) {
            const { data: fallback } = await tryCatch(() => agentHelpers.resolveTierModel({ platformId, tierId: DEFAULT_CHAT_TIER_ID, log }))
            if (!isNil(fallback) && fallback.modelId !== resolved.modelId) {
                log.warn({ from: resolved.modelId, to: fallback.modelId, platform: { id: platformId } }, '[agentDraftAi] Retrying the draft on the model chat runs on')
                attempt = await runDraft({ model: fallback.model, prompt })
                usedModelId = fallback.modelId
            }
        }

        const { data: raw, error: generateError } = attempt
        if (!isNil(generateError) || isNil(raw)) {
            const reason = describeError(generateError)
            const status = statusOf(generateError)
            log.error({ error: generateError, reason, status, provider: resolved.provider, model: { id: usedModelId }, platform: { id: platformId } }, '[agentDraftAi] The model call failed while drafting an agent')
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: rejectedCredentials(status)
                    ? `${resolved.provider} rejected the API key. Update it in the AI settings and try again.`
                    : `The ${resolved.provider} provider could not run ${usedModelId}: ${reason.slice(0, REASON_LIMIT)}` },
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
// 401 is the key itself being refused, and the body says so in terms written for whoever holds it
// rather than whoever configured it: OpenRouter answers "User not found". 403 is a key that
// resolved but may not carry this model, so its own reason is the useful one and is left alone.
async function runDraft({ model, prompt }: { model: LanguageModel, prompt: string }) {
    return tryCatch(async () => {
        const { text } = await generateText({
            model,
            instructions: DRAFT_SYSTEM_PROMPT,
            prompt,
            telemetry: agentAiUtils.buildTelemetry({ functionId: 'agent-draft' }),
            abortSignal: AbortSignal.timeout(DRAFT_TIMEOUT_MS),
        })
        return text
    })
}

function statusOf(error: unknown): number | undefined {
    return APICallError.isInstance(error) ? error.statusCode : undefined
}

function rejectedCredentials(status?: number): boolean {
    return status === 401
}

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
