import { createHash } from 'crypto'
import { ActivepiecesAiConsumerSource, AiCallContext, AiChargeBasis, AIProviderName, AiUsageEnvironment, AiUsageOrigin, isNil } from '@activepieces/core-utils'
import { modelCatalog } from '@activepieces/server-utils'
import { DEFAULT_MCP_DATA, ReportAiUsageRequest, RunEnvironment } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'
import { AiUsageDailyEntity } from './ai-usage-daily-entity'

export const aiUsageRollup = {
    async record(input: ReportAiUsageRequest): Promise<void> {
        const dimensions = dimensionsOf(input)
        const cost = await costOf(input)
        await aiUsageDailyRepo().query(UPSERT_SQL, [
            idOf(dimensions),
            dimensions.day,
            dimensions.platformId,
            dimensions.projectId,
            dimensions.origin,
            dimensions.environment,
            dimensions.flowId,
            dimensions.agentId,
            dimensions.userId,
            dimensions.provider,
            dimensions.providerConfigId,
            dimensions.modelId,
            cost.unpriced ? 1 : 0,
            input.inputTokens ?? 0,
            input.outputTokens ?? 0,
            input.cacheReadTokens ?? 0,
            input.cacheWriteTokens ?? 0,
            input.reasoningTokens ?? 0,
            cost.reportedCostUsd,
            cost.estimatedCostUsd,
        ])
    },
    async callContextForFlowRun({ flowRunId, projectId }: { flowRunId: string, projectId: string }): Promise<AiCallContext> {
        if (flowRunId === DEFAULT_MCP_DATA.flowRunId) {
            return { origin: AiUsageOrigin.ACTION_RUN, environment: AiUsageEnvironment.PRODUCTION }
        }
        const run = await flowRunRepo().findOne({ where: { id: flowRunId, projectId }, select: { environment: true } })
        return { origin: AiUsageOrigin.FLOW_STEP, environment: environmentOf(run?.environment) }
    },
    environmentOf,
}

function environmentOf(environment: RunEnvironment | undefined): AiUsageEnvironment {
    return environment === RunEnvironment.TESTING ? AiUsageEnvironment.TESTING : AiUsageEnvironment.PRODUCTION
}

function dimensionsOf(input: ReportAiUsageRequest): UsageDimensions {
    const { billing } = input
    const shared = {
        day: new Date().toISOString().slice(0, 10),
        platformId: billing.platformId,
        projectId: billing.projectId,
        environment: billing.context?.environment ?? AiUsageEnvironment.PRODUCTION,
        provider: input.provider,
        providerConfigId: input.providerConfigId ?? null,
        modelId: input.modelId,
    }
    switch (billing.source) {
        case ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW: {
            const origin = billing.context?.origin ?? AiUsageOrigin.FLOW_STEP
            return {
                ...shared,
                origin,
                flowId: origin === AiUsageOrigin.ACTION_RUN ? null : billing.flowRun.flowId,
                agentId: null,
                userId: null,
            }
        }
        case ActivepiecesAiConsumerSource.CHAT: {
            const origin = billing.context?.origin ?? AiUsageOrigin.CHAT
            return {
                ...shared,
                origin,
                flowId: billing.context?.flowId ?? null,
                agentId: billing.context?.agentId ?? null,
                userId: PER_USER_ORIGINS.includes(origin) ? input.chat?.userId ?? billing.chat?.userId ?? null : null,
            }
        }
    }
}

async function costOf(input: ReportAiUsageRequest): Promise<UsageCost> {
    const reported = input.observedCostUsd ?? (input.usage.type === AiChargeBasis.PROVIDER_REPORTED_COST ? input.usage.costUsd : undefined)
    if (!isNil(reported)) {
        return { reportedCostUsd: reported, estimatedCostUsd: 0, unpriced: false }
    }
    const estimated = await estimateCostUsd(input)
    if (isNil(estimated)) {
        return { reportedCostUsd: 0, estimatedCostUsd: 0, unpriced: true }
    }
    return { reportedCostUsd: 0, estimatedCostUsd: estimated, unpriced: false }
}

async function estimateCostUsd(input: ReportAiUsageRequest): Promise<number | undefined> {
    if (isNil(input.inputTokens) && isNil(input.outputTokens)) {
        return undefined
    }
    const catalog = await modelCatalog.load()
    const price = catalog.lookup({ provider: input.provider, modelId: input.modelId })
    if (isNil(price) || isNil(price.inputCostPerMillionTokens) || isNil(price.outputCostPerMillionTokens)) {
        return undefined
    }
    const cacheRead = input.cacheReadTokens ?? 0
    const cacheWrite = input.cacheWriteTokens ?? 0
    const uncachedInput = Math.max((input.inputTokens ?? 0) - cacheRead - cacheWrite, 0)
    const dollars = uncachedInput * price.inputCostPerMillionTokens
        + cacheRead * (price.cacheReadCostPerMillionTokens ?? price.inputCostPerMillionTokens)
        + cacheWrite * (price.cacheWriteCostPerMillionTokens ?? price.inputCostPerMillionTokens)
        + (input.outputTokens ?? 0) * price.outputCostPerMillionTokens
    return dollars / TOKENS_PER_MILLION
}

function idOf(dimensions: UsageDimensions): string {
    const key = [
        dimensions.day,
        dimensions.platformId,
        dimensions.projectId,
        dimensions.origin,
        dimensions.environment,
        dimensions.flowId,
        dimensions.agentId,
        dimensions.userId,
        dimensions.provider,
        dimensions.providerConfigId,
        dimensions.modelId,
    ]
    return createHash('sha256').update(JSON.stringify(key)).digest('hex')
}

const aiUsageDailyRepo = repoFactory(AiUsageDailyEntity)

const PER_USER_ORIGINS = [AiUsageOrigin.CHAT, AiUsageOrigin.AGENT, AiUsageOrigin.AGENT_BUILDER]

const TOKENS_PER_MILLION = 1_000_000

const UPSERT_SQL = `
    INSERT INTO "ai_usage_daily" (
        "id", "day", "platformId", "projectId", "origin", "environment", "flowId", "agentId", "userId",
        "provider", "providerConfigId", "modelId", "calls", "unpricedCalls",
        "inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens", "reasoningTokens",
        "reportedCostUsd", "estimatedCostUsd"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1, $13, $14, $15, $16, $17, $18, $19, $20)
    ON CONFLICT ("id") DO UPDATE SET
        "calls" = "ai_usage_daily"."calls" + 1,
        "unpricedCalls" = "ai_usage_daily"."unpricedCalls" + EXCLUDED."unpricedCalls",
        "inputTokens" = "ai_usage_daily"."inputTokens" + EXCLUDED."inputTokens",
        "outputTokens" = "ai_usage_daily"."outputTokens" + EXCLUDED."outputTokens",
        "cacheReadTokens" = "ai_usage_daily"."cacheReadTokens" + EXCLUDED."cacheReadTokens",
        "cacheWriteTokens" = "ai_usage_daily"."cacheWriteTokens" + EXCLUDED."cacheWriteTokens",
        "reasoningTokens" = "ai_usage_daily"."reasoningTokens" + EXCLUDED."reasoningTokens",
        "reportedCostUsd" = "ai_usage_daily"."reportedCostUsd" + EXCLUDED."reportedCostUsd",
        "estimatedCostUsd" = "ai_usage_daily"."estimatedCostUsd" + EXCLUDED."estimatedCostUsd"
`

type UsageDimensions = {
    day: string
    platformId: string
    projectId: string | null
    origin: AiUsageOrigin
    environment: AiUsageEnvironment
    flowId: string | null
    agentId: string | null
    userId: string | null
    provider: AIProviderName
    providerConfigId: string | null
    modelId: string
}

type UsageCost = {
    reportedCostUsd: number
    estimatedCostUsd: number
    unpriced: boolean
}
