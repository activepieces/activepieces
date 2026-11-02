import { ActivepiecesAiConsumerSource, AiCallTokens, AiChargeBasis, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { ConsumableFeatureId, isAppSumoCreditedPlan, ReportAiUsageRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../database/redis-connections'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { trackBillingAndSendTelemetry } from '../platform/billing-and-telemetry'
import { AiCreditConsumptionProperties, billingProvider, ChatAppSumoConsumptionProperties, ChatCreditConsumptionProperties, CreditUsageSource } from '../platform/billing-provider'
import { chargeFor, CostBasis, costBasisOf } from './ai-credits'
import { aiUsageHooks } from './ai-usage-hooks'
import { AiUsageBlock } from './usage/ai-usage-block'
import { aiUsageEvent } from './usage/ai-usage-event'

export const aiUsageService = (log: FastifyBaseLogger) => ({
    async report(input: ReportAiUsageRequest): Promise<void> {
        const usage = await usageBlockOf({ input, log })
        if (input.usage.type === AiChargeBasis.USAGE_ONLY) {
            await trackUsageOnly({ input, usage, log })
            return
        }
        const toolCalls = input.toolCalls ?? 0
        const credits = chargeFor({ usage: input.usage, toolCalls })
        const costBasis = costBasisOf(input.usage)
        const platformId = input.billing.platformId
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const appSumo = isAppSumoCreditedPlan(platformPlan.plan)
        const chat = chatEventOf({ input, toolCalls, costBasis, usage })
        if (!isNil(chat)) {
            await trackBillingAndSendTelemetry({
                log,
                licenseKey: platformPlan.licenseKey,
                credits: { platformId, value: credits, source: CreditUsageSource.CHAT, idempotencyKey: input.idempotencyKey, properties: chat.credits },
                appSumo: appSumo ? { platformId, value: credits, source: CreditUsageSource.CHAT, idempotencyKey: `${input.idempotencyKey}:appSumo`, properties: chat.appSumo } : undefined,
            })
        }
        else {
            const properties = billingProperties({ input, toolCalls, costBasis, usage })
            await trackBillingAndSendTelemetry({
                log,
                licenseKey: platformPlan.licenseKey,
                credits: { platformId, value: credits, source: CreditUsageSource.AI, idempotencyKey: input.idempotencyKey, properties },
                appSumo: appSumo ? { platformId, value: credits, source: CreditUsageSource.AI, idempotencyKey: `${input.idempotencyKey}:appSumo`, properties } : undefined,
            })
        }
        await addConversationCredits({ input, credits, log })
    },
})

async function usageBlockOf({ input, log }: { input: ReportAiUsageRequest, log: FastifyBaseLogger }): Promise<AiUsageBlock | undefined> {
    const { data, error } = await tryCatch(() => aiUsageEvent.blockOf(input))
    if (!isNil(error)) {
        log.warn({ error, provider: input.provider, model: { id: input.modelId } }, '[aiUsageService] Could not build the usage block, so this call is billed without analytics')
        return undefined
    }
    return data ?? undefined
}

async function trackUsageOnly({ input, usage, log }: { input: ReportAiUsageRequest, usage: AiUsageBlock | undefined, log: FastifyBaseLogger }): Promise<void> {
    if (isNil(usage)) {
        return
    }
    await billingProvider.get(log).trackFeature({
        featureId: ConsumableFeatureId.AP_CREDITS,
        platformId: input.billing.platformId,
        value: USAGE_ONLY_VALUE,
        idempotencyKey: input.idempotencyKey,
        source: CreditUsageSource.AI_USAGE,
        properties: { usage },
    })
}

async function addConversationCredits({ input, credits, log }: { input: ReportAiUsageRequest, credits: number, log: FastifyBaseLogger }): Promise<void> {
    if (input.billing.source !== ActivepiecesAiConsumerSource.CHAT) {
        return
    }
    const { conversationId } = input.billing
    const { error } = await tryCatch(() => distributedStore.runOnceWithin(
        `ai-usage:conversation-credits:${input.idempotencyKey}`,
        RETRY_WINDOW_SECONDS,
        () => aiUsageHooks.get(log).addConversationCredits({ conversationId, credits }),
    ))
    if (!isNil(error)) {
        log.warn({ conversation: { id: conversationId }, error }, '[aiUsageService] Could not add this call to the conversation credit total')
    }
}

function chatEventOf({ input, toolCalls, costBasis, usage }: PropertiesParams): { credits: ChatCreditConsumptionProperties, appSumo: ChatAppSumoConsumptionProperties } | undefined {
    if (input.billing.source !== ActivepiecesAiConsumerSource.CHAT || isNil(input.chat)) {
        return undefined
    }
    const { conversationId } = input.billing
    const { userId, turnIndex, tier } = input.chat
    const projectId = input.billing.projectId ?? PROJECTLESS_CHAT
    return {
        credits: {
            platformId: input.billing.platformId,
            projectId,
            userId,
            conversationId,
            turnIndex,
            messages: MESSAGES_PER_MODEL_CALL,
            toolCalls,
            provider: input.provider,
            model: input.modelId,
            tier,
            ...costBasis,
            ...tokensOf(input),
            ...spreadIfDefined('usage', usage),
        },
        appSumo: { platformId: input.billing.platformId, projectId, conversationId, turnIndex, tier },
    }
}

function billingProperties({ input, toolCalls, costBasis, usage }: PropertiesParams): AiCreditConsumptionProperties {
    return {
        platformId: input.billing.platformId,
        projectId: projectIdOf(input),
        flowId: input.flowRun?.flowId ?? OUTSIDE_A_FLOW,
        flowRunId: input.flowRun?.flowRunId ?? input.requestId ?? OUTSIDE_A_FLOW,
        environment: UNKNOWN_ENVIRONMENT,
        messages: MESSAGES_PER_MODEL_CALL,
        toolCalls,
        breakdown: [{
            provider: input.provider,
            model: input.modelId,
            messages: MESSAGES_PER_MODEL_CALL,
            toolCalls,
        }],
        ...costBasis,
        ...tokensOf(input),
        ...spreadIfDefined('usage', usage),
    }
}

function tokensOf(input: ReportAiUsageRequest): AiCallTokens {
    return {
        ...spreadIfDefined('inputTokens', input.inputTokens),
        ...spreadIfDefined('outputTokens', input.outputTokens),
    }
}

function projectIdOf(input: ReportAiUsageRequest): string {
    return input.billing.projectId ?? PROJECTLESS_CHAT
}

type PropertiesParams = {
    input: ReportAiUsageRequest
    toolCalls: number
    costBasis: CostBasis | undefined
    usage: AiUsageBlock | undefined
}

const MESSAGES_PER_MODEL_CALL = 1
const PROJECTLESS_CHAT = 'chat'
const OUTSIDE_A_FLOW = 'none'
const UNKNOWN_ENVIRONMENT = 'unknown'
const RETRY_WINDOW_SECONDS = 600
const USAGE_ONLY_VALUE = 0
