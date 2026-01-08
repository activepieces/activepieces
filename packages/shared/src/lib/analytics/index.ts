import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { FlowStatus } from '../flows/flow'
import { UserWithMetaInformation } from '../user'

export const UpdatePlatformReportRequest = Type.Object({
    outdated: Type.Boolean(),
})
export type UpdatePlatformReportRequest = Static<typeof UpdatePlatformReportRequest>

export const AnalyticsPieceReportItem = Type.Object({
    name: Type.String(),
    displayName: Type.String(),
    logoUrl: Type.String(),
    usageCount: Type.Number(),
})
export type AnalyticsPieceReportItem = Static<typeof AnalyticsPieceReportItem>

export const AnalyticsPieceReport = Type.Array(AnalyticsPieceReportItem)
export type AnalyticsPieceReport = Static<typeof AnalyticsPieceReport>

export const AnalyticsRunsUsageItem = Type.Object({
    day: Type.String(),
    totalRuns: Type.Number(),
    minutesSaved: Type.Number(),
})
export type AnalyticsRunsUsageItem = Static<typeof AnalyticsRunsUsageItem>

export const AnalyticsRunsUsage = Type.Array(AnalyticsRunsUsageItem)
export type AnalyticsRunsUsage = Static<typeof AnalyticsRunsUsage>

export const AnalyticsFlowReportItem = Type.Object({
    flowId: Type.String(),
    flowName: Type.String(),
    projectId: Type.String(),
    projectName: Type.String(),
    status: Type.Enum(FlowStatus),
    runs: Type.Number(),
    timeSavedPerRun: Type.Object({
        value: Nullable(Type.Number()),
        isEstimated: Type.Boolean(),
    }),
    minutesSaved: Type.Number(),
    ownerId: Type.String(),
})
export type AnalyticsFlowReportItem = Static<typeof AnalyticsFlowReportItem>

export const AnalyticsFlowReport = Type.Array(AnalyticsFlowReportItem)
export type AnalyticsFlowReport = Static<typeof AnalyticsFlowReport>

export const PlatformAnalyticsReport = Type.Object({
    ...BaseModelSchema,
    cachedAt: Type.String(),
    runsUsage: AnalyticsRunsUsage,
    flowsDetails: AnalyticsFlowReport,
    timeSaved: Type.Number(),
    platformId: Type.String(),
    users: Type.Array(UserWithMetaInformation),
})
export type PlatformAnalyticsReport = Static<typeof PlatformAnalyticsReport>