import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, PlatformId, ProjectId, tryCatch } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { CHAT_BYOK_CREDIT_WEIGHT, DraftAgentResponse, isAppSumoCreditedPlan } from '@activepieces/shared'
import { generateText, Output, zodSchema } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { trackBillingAndSendTelemetry } from '../../platform/billing-and-telemetry'
import { CreditUsageSource } from '../../platform/billing-provider'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { agentHelpers } from './agent-helpers'

const DRAFT_TIMEOUT_MS = 30_000
const FAST_TIER_ID = 'fast'
const DRAFT_SYSTEM_PROMPT = readFileSync(path.resolve('packages/server/api/src/assets/prompts/agent-draft-prompt.md'), 'utf8')

export const agentDraftAi = (log: FastifyBaseLogger) => ({
    async draft({ platformId, projectId, prompt }: DraftParams): Promise<DraftAgentResponse> {
        const { data: model, error: modelError } = await tryCatch(() => agentHelpers.resolveFastModel({ platformId, log }))
        if (!isNil(modelError) || isNil(model)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Connect an AI provider before drafting an agent, or start from a starter agent instead' },
            })
        }

        const { data: generated, error: generateError } = await tryCatch(() => generateText({
            model,
            instructions: DRAFT_SYSTEM_PROMPT,
            prompt,
            output: Output.object({ schema: zodSchema(DraftAgentResponse) }),
            telemetry: agentAiUtils.buildTelemetry({ functionId: 'agent-draft' }),
            abortSignal: AbortSignal.timeout(DRAFT_TIMEOUT_MS),
        }))
        if (!isNil(generateError) || isNil(generated)) {
            log.warn({ error: generateError, platform: { id: platformId } }, '[agentDraftAi] Could not draft an agent')
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Could not draft an agent from that description, try rewording it' },
            })
        }
        await debitDraft({ platformId, projectId, log })
        return generated.output
    },
})

async function debitDraft({ platformId, projectId, log }: { platformId: PlatformId, projectId: ProjectId, log: FastifyBaseLogger }): Promise<void> {
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

    const { error } = await tryCatch(() => trackBillingAndSendTelemetry({
        log,
        licenseKey: platformPlan.licenseKey,
        credits: usage,
        ...(isAppSumoCreditedPlan(platformPlan.plan) ? { appSumo: { ...usage, idempotencyKey: `agent-draft-appsumo:${apId()}` } } : {}),
    }))
    if (!isNil(error)) {
        log.warn({ error, platform: { id: platformId } }, '[agentDraftAi] Draft usage was not recorded')
    }
}

type DraftParams = {
    platformId: PlatformId
    projectId: ProjectId
    prompt: string
}
