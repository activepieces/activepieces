import { AIProviderName } from '@activepieces/core-utils'
import { z } from 'zod'

export const AI_USAGE_PERIODS = ['1h', '6h', '12h', '24h', '7d', '30d', '90d', 'this-month', 'last-month'] as const
export const AI_USAGE_SCOPES = ['all', 'production', 'testing'] as const
export const AI_USAGE_DIMENSIONS = ['project', 'flow', 'agent', 'user', 'key', 'model'] as const
export const AI_USAGE_SOURCES = ['flow-steps', 'agent-steps', 'agents', 'chat', 'knowledge-base'] as const

export const AiUsagePeriod = z.enum(AI_USAGE_PERIODS)
export type AiUsagePeriod = z.infer<typeof AiUsagePeriod>

export const AiUsageScope = z.enum(AI_USAGE_SCOPES)
export type AiUsageScope = z.infer<typeof AiUsageScope>

export const AiUsageDimension = z.enum(AI_USAGE_DIMENSIONS)
export type AiUsageDimension = z.infer<typeof AiUsageDimension>

export const AiUsageSource = z.enum(AI_USAGE_SOURCES)
export type AiUsageSource = z.infer<typeof AiUsageSource>

export const AI_USAGE_RELATED_DIMENSIONS: Record<AiUsageDimension, AiUsageDimension[]> = {
    project: ['flow', 'agent', 'user', 'model', 'key'],
    flow: ['model', 'key'],
    agent: ['user', 'model', 'key'],
    user: ['agent', 'project', 'model'],
    key: ['project', 'flow', 'model'],
    model: ['project', 'flow', 'agent', 'key'],
}

export const AI_USAGE_SOURCE_DIMENSIONS: AiUsageDimension[] = ['project', 'agent']

export const AI_USAGE_NO_PROJECT_ID = 'no-project'
export const AI_USAGE_CREDITS_KEY_ID = 'activepieces-credits'
export const AI_USAGE_UNKNOWN_KEY_PREFIX = 'unknown-'

export const AiUsageQuery = z.object({
    period: AiUsagePeriod,
    scope: AiUsageScope,
})
export type AiUsageQuery = z.infer<typeof AiUsageQuery>

export const AiUsageItemsQuery = AiUsageQuery.extend({
    dimension: AiUsageDimension,
})
export type AiUsageItemsQuery = z.infer<typeof AiUsageItemsQuery>

export const AiUsageDetailParams = z.object({
    dimension: AiUsageDimension,
    id: z.string().min(1).max(512),
})
export type AiUsageDetailParams = z.infer<typeof AiUsageDetailParams>

export const AiUsageHistory = z.object({
    trackingSince: z.string().nullable(),
    hasAnyUsage: z.boolean(),
    coveredDays: z.number(),
    periodDays: z.number(),
    currentCoverage: z.number(),
    comparable: z.boolean(),
})
export type AiUsageHistory = z.infer<typeof AiUsageHistory>

const AiUsageRange = z.object({
    start: z.string(),
    end: z.string(),
})

export const AiUsageRanges = z.object({
    current: AiUsageRange,
    previous: AiUsageRange,
})
export type AiUsageRanges = z.infer<typeof AiUsageRanges>

export const AiUsageTotals = z.object({
    spendUsd: z.number(),
    previousSpendUsd: z.number(),
    calls: z.number(),
    previousCalls: z.number(),
    tokens: z.number(),
    previousTokens: z.number(),
    cacheShare: z.number(),
    managedCredits: z.number(),
})
export type AiUsageTotals = z.infer<typeof AiUsageTotals>

export const AiUsageSeriesPoint = z.object({
    label: z.string(),
    spendUsd: z.number().nullable(),
    calls: z.number().nullable(),
    tokens: z.number().nullable(),
    previousSpendUsd: z.number().nullable(),
    previousCalls: z.number().nullable(),
    previousTokens: z.number().nullable(),
})
export type AiUsageSeriesPoint = z.infer<typeof AiUsageSeriesPoint>

export const AiUsageItem = z.object({
    dimension: AiUsageDimension,
    id: z.string(),
    name: z.string().nullable(),
    parent: z.string().optional(),
    provider: z.enum(AIProviderName).optional(),
    flowCount: z.number().optional(),
    agentCount: z.number().optional(),
    spendUsd: z.number(),
    previousSpendUsd: z.number(),
    calls: z.number(),
    tokens: z.number(),
    comparable: z.boolean(),
    sharedUsd: z.number().optional(),
    inputPrice: z.number().optional(),
    outputPrice: z.number().optional(),
})
export type AiUsageItem = z.infer<typeof AiUsageItem>

export const AiUsageSourceSpend = z.object({
    source: AiUsageSource,
    spendUsd: z.number(),
})
export type AiUsageSourceSpend = z.infer<typeof AiUsageSourceSpend>

export const AiUsageOverview = z.object({
    history: AiUsageHistory,
    ranges: AiUsageRanges,
    totals: AiUsageTotals,
    series: z.array(AiUsageSeriesPoint),
    bySource: z.array(AiUsageSourceSpend),
    top: z.record(AiUsageDimension, z.array(AiUsageItem)),
})
export type AiUsageOverview = z.infer<typeof AiUsageOverview>

export const AiUsageItemList = z.object({
    history: AiUsageHistory,
    ranges: AiUsageRanges,
    items: z.array(AiUsageItem),
    count: z.number(),
    itemsSpendUsd: z.number(),
    totalSpendUsd: z.number(),
    truncated: z.boolean(),
})
export type AiUsageItemList = z.infer<typeof AiUsageItemList>

export const AiUsageDetail = z.object({
    history: AiUsageHistory,
    ranges: AiUsageRanges,
    item: AiUsageItem,
    series: z.array(AiUsageSeriesPoint),
    related: z.partialRecord(AiUsageDimension, z.array(AiUsageItem)),
    bySource: z.array(AiUsageSourceSpend).optional(),
    runs: z.number().optional(),
    reportedUsd: z.number().optional(),
    estimatedUsd: z.number().optional(),
})
export type AiUsageDetail = z.infer<typeof AiUsageDetail>
