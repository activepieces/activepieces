import { createHash } from 'crypto'
import { ActivepiecesAiConsumerSource, AiChargeBasis, AIProviderName, AiUsageEnvironment, AiUsageOrigin, isNil } from '@activepieces/core-utils'
import { ReportAiUsageRequest } from '@activepieces/shared'
import { chargeFor, dollarsPerCredit } from '../ai-credits'
import { aiCallContext } from './ai-call-context'
import { AiUsageBlock } from './ai-usage-block'
import { aiUsagePrice } from './ai-usage-price'

function dimensionsOf(input: ReportAiUsageRequest): AiUsageDimensions {
    const { billing } = input
    const context = billing.context
    const shared = {
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
    const reported = input.observedCostUsd ?? (input.usage.type === AiChargeBasis.PROVIDER_REPORTED_COST ? input.usage.costUsd : undefined)
    if (input.usage.type === AiChargeBasis.USAGE_ONLY) {
        return usageOnlyCostsOf({ input, reported })
    }
    const credits = chargeFor({ usage: input.usage, toolCalls: input.toolCalls ?? 0 })
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

async function usageOnlyCostsOf({ input, reported }: { input: ReportAiUsageRequest, reported: number | undefined }): Promise<AiUsageCosts> {
    if (input.provider === AIProviderName.ACTIVEPIECES) {
        return { reportedCostUsd: 0, estimatedCostUsd: 0, managedCredits: 0, unpriced: false }
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

function runIdOf({ input, origin }: { input: ReportAiUsageRequest, origin: AiUsageOrigin }): string | null {
    if (!RUN_COUNTING_ORIGINS.includes(origin)) {
        return null
    }
    const { billing } = input
    const flowRunId = billing.context?.flowRunId ?? (billing.source === ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW ? billing.flowRun.flowRunId : undefined)
    return aiCallContext.isRealRunId(flowRunId) ? flowRunId : null
}

const SERIES_ID_LENGTH = 32
const PER_USER_ORIGINS = [AiUsageOrigin.CHAT, AiUsageOrigin.AGENT, AiUsageOrigin.AGENT_BUILDER]
const RUN_COUNTING_ORIGINS = [AiUsageOrigin.FLOW_STEP, AiUsageOrigin.FLOW_AGENT_STEP]
export const aiUsageEvent = {
    async blockOf(input: ReportAiUsageRequest): Promise<AiUsageBlock> {
        const dimensions = dimensionsOf(input)
        const costs = await costsOf(input)
        return {
            v: 1,
            ...dimensions,
            runId: runIdOf({ input, origin: dimensions.origin }),
            inputTokens: input.inputTokens ?? 0,
            outputTokens: input.outputTokens ?? 0,
            cacheReadTokens: input.cacheReadTokens ?? 0,
            cacheWriteTokens: input.cacheWriteTokens ?? 0,
            reasoningTokens: input.reasoningTokens ?? 0,
            reportedCostUsd: costs.reportedCostUsd,
            estimatedCostUsd: costs.estimatedCostUsd,
            managedCredits: costs.managedCredits,
            unpriced: costs.unpriced,
        }
    },
    seriesIdOf({ platformId, block }: { platformId: string, block: AiUsageDimensions }): string {
        const tuple = [platformId, block.projectId, block.flowId, block.agentId, block.userId, block.provider, block.providerConfigId, block.modelId, block.origin, block.environment]
        return createHash('sha256').update(JSON.stringify(tuple)).digest('hex').slice(0, SERIES_ID_LENGTH)
    },
}

export type AiUsageDimensions = Pick<AiUsageBlock, 'projectId' | 'flowId' | 'agentId' | 'userId' | 'provider' | 'providerConfigId' | 'modelId' | 'origin' | 'environment'>

type AiUsageCosts = {
    reportedCostUsd: number
    estimatedCostUsd: number
    managedCredits: number
    unpriced: boolean
}
