import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { FlowStatus } from '../flows/flow'
import { UserWithMetaInformation } from '../user'

export const AnalyticsRunsUsageItem = Type.Object({
    day: Type.String(),
    flowId: Type.String(),
    runs: Type.Number(),
})
export type AnalyticsRunsUsageItem = Static<typeof AnalyticsRunsUsageItem>

export const AnalyticsRunsUsage = Type.Array(AnalyticsRunsUsageItem)
export type AnalyticsRunsUsage = Static<typeof AnalyticsRunsUsage>

export const AnalyticsFlowReportItem = Type.Object({
    flowId: Type.String(),
    flowName: Type.String(),
    projectId: Type.String(),
    status: Type.Enum(FlowStatus),
    timeSavedPerRun: Nullable(Type.Number()),
    ownerId: Nullable(Type.String()),
})
export type AnalyticsFlowReportItem = Static<typeof AnalyticsFlowReportItem>

export const AnalyticsFlowReport = Type.Array(AnalyticsFlowReportItem)
export type AnalyticsFlowReport = Static<typeof AnalyticsFlowReport>

export const PlatformAnalyticsReport = Type.Object({
    ...BaseModelSchema,
    cachedAt: Type.String(),
    runs: AnalyticsRunsUsage,
    flows: AnalyticsFlowReport,
    platformId: Type.String(),
    users: Type.Array(UserWithMetaInformation),
})
export type PlatformAnalyticsReport = Static<typeof PlatformAnalyticsReport>