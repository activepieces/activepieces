import { createHash } from 'crypto'
import { ActivepiecesAiConsumerSource, AiChargeBasis, AIProviderName, AiUsageEnvironment, AiUsageOrigin, isNil } from '@activepieces/core-utils'
import { ReportAiUsageRequest } from '@activepieces/shared'
import { z } from 'zod'
import { chargeFor, dollarsPerCredit } from '../ai-credits'
import { aiCallContext } from './ai-call-context'
import { aiUsagePrice } from './ai-usage-price'

function dimensionsOf(input: ReportAiUsageRequest): AiUsageDimensions {
    const { billing } = input
    const context = billing.context
    const shared = {
        platformId: billing.platformId,
        projectId: billing.projectId ?? null,
        environment: context?.environment ?? AiUsageEnvironment.PRODUCTION,
        provider: input.provider,
        providerConfigId: input.providerConfigId ?? null,
        modelId: input.modelId,
    }
    switch (billing.source) {
        case ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW: {
            const origin = context?.origin ?? AiUsageOrigin.FLOW_STEP
            const inRealRun = origin !== AiUsageOrigin.ACTION_RUN
            return { ...shared, origin, flowId: inRealRun ? context?.flowId ?? billing.flowRun.flowId : null, agentId: null, userId: null }
        }
        case ActivepiecesAiConsumerSource.CHAT: {
            const origin = context?.origin ?? AiUsageOrigin.CHAT
            const userId = PER_USER_ORIGINS.includes(origin) ? input.chat?.userId ?? billing.chat?.userId ?? context?.userId ?? null : null
            return { ...shared, origin, flowId: context?.flowId ?? null, agentId: context?.agentId ?? null, userId }
        }
    }
}

async function costsOf(input: ReportAiUsageRequest): Promise<AiUsageCosts> {
    const credits = chargeFor({ usage: input.usage, toolCalls: input.toolCalls ?? 0 })
    const reported = input.observedCostUsd ?? (input.usage.type === AiChargeBasis.PROVIDER_REPORTED_COST ? input.usage.costUsd : undefined)
    if (input.provider === AIProviderName.ACTIVEPIECES) {
        const billedUsd = reported ?? (credits > 0 ? credits * dollarsPerCredit() : undefined)
        if (!isNil(billedUsd)) {
            return { reportedCostUsd: billedUsd, estimatedCostUsd: 0, managedCredits: credits, unpriced: false }
        }
        return { ...await estimatedCosts(input), managedCredits: credits }
    }
    if (!isNil(reported)) {
        return { reportedCostUsd: reported, estimatedCostUsd: 0, managedCredits: 0, unpriced: false }
    }
    return { ...await estimatedCosts(input), managedCredits: 0 }
}

async function estimatedCosts(input: ReportAiUsageRequest): Promise<Omit<AiUsageCosts, 'managedCredits'>> {
    const estimated = await aiUsagePrice.estimateUsd({ provider: input.provider, modelId: input.modelId, tokens: input })
    return { reportedCostUsd: 0, estimatedCostUsd: estimated ?? 0, unpriced: isNil(estimated) }
}

function runKeyOf({ input, origin }: { input: ReportAiUsageRequest, origin: AiUsageOrigin }): string | null {
    if (!RUN_COUNTING_ORIGINS.includes(origin)) {
        return null
    }
    const { billing } = input
    const flowRunId = billing.context?.flowRunId ?? (billing.source === ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW ? billing.flowRun.flowRunId : undefined)
    return aiCallContext.isRealRunId(flowRunId) ? flowRunId : null
}

const SERIES_ID_LENGTH = 32
const SERIES_DIMENSIONS = ['platformId', 'projectId', 'flowId', 'agentId', 'userId', 'provider', 'providerConfigId', 'modelId', 'origin', 'environment'] as const
const PER_USER_ORIGINS = [AiUsageOrigin.CHAT, AiUsageOrigin.AGENT, AiUsageOrigin.AGENT_BUILDER]
const RUN_COUNTING_ORIGINS = [AiUsageOrigin.FLOW_STEP, AiUsageOrigin.FLOW_AGENT_STEP]
const ID_MAX = 21
const MODEL_ID_MAX = 255

const nullableId = z.string().max(ID_MAX).nullable()
const counter = z.number().finite().nonnegative()

export const aiUsageEvent = {
    async build(input: ReportAiUsageRequest): Promise<BuiltAiUsageEvent> {
        const dimensions = dimensionsOf(input)
        const costs = await costsOf(input)
        const event: AiUsageEvent = {
            ...dimensions,
            seriesId: aiUsageEvent.seriesIdOf(dimensions),
            unpricedCalls: costs.unpriced ? 1 : 0,
            inputTokens: input.inputTokens ?? 0,
            outputTokens: input.outputTokens ?? 0,
            cacheReadTokens: input.cacheReadTokens ?? 0,
            cacheWriteTokens: input.cacheWriteTokens ?? 0,
            reasoningTokens: input.reasoningTokens ?? 0,
            reportedCostUsd: costs.reportedCostUsd,
            estimatedCostUsd: costs.estimatedCostUsd,
            spendUsd: costs.reportedCostUsd + costs.estimatedCostUsd,
            managedCredits: costs.managedCredits,
        }
        return { event, runKey: runKeyOf({ input, origin: dimensions.origin }) }
    },
    seriesIdOf(dimensions: AiUsageDimensions): string {
        const tuple = SERIES_DIMENSIONS.map((key) => dimensions[key] ?? null)
        return createHash('sha256').update(JSON.stringify(tuple)).digest('hex').slice(0, SERIES_ID_LENGTH)
    },
}

export const AiUsageEvent = z.object({
    seriesId: z.string().length(SERIES_ID_LENGTH),
    platformId: z.string().min(1).max(ID_MAX),
    projectId: nullableId,
    flowId: nullableId,
    agentId: nullableId,
    userId: nullableId,
    provider: z.enum(AIProviderName),
    providerConfigId: nullableId,
    modelId: z.string().min(1).max(MODEL_ID_MAX),
    origin: z.enum(AiUsageOrigin),
    environment: z.enum(AiUsageEnvironment),
    unpricedCalls: counter,
    inputTokens: counter,
    outputTokens: counter,
    cacheReadTokens: counter,
    cacheWriteTokens: counter,
    reasoningTokens: counter,
    reportedCostUsd: counter,
    estimatedCostUsd: counter,
    spendUsd: counter,
    managedCredits: counter,
})
export type AiUsageEvent = z.infer<typeof AiUsageEvent>

export type AiUsageDimensions = Pick<AiUsageEvent, typeof SERIES_DIMENSIONS[number]>

export type BuiltAiUsageEvent = {
    event: AiUsageEvent
    runKey: string | null
}

type AiUsageCosts = {
    reportedCostUsd: number
    estimatedCostUsd: number
    managedCredits: number
    unpriced: boolean
}
