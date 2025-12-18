import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'


export const DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP = 2

export const UpdateTimeSavedPerRunRequest = Type.Object({
    flowId: Type.String(),
    timeSavedPerRun: Nullable(Type.Number()),
})
export type UpdateTimeSavedPerRunRequest = Static<typeof UpdateTimeSavedPerRunRequest>

export const UpdatePlatformReportRequest = Type.Object({
    estimatedTimeSavedPerStep: Nullable(Type.Number()),
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

export const AnalyticsProjectReportItem = Type.Object({
    id: Type.String(),
    displayName: Type.String(),
    activeFlows: Type.Number(),
    totalFlows: Type.Number(),
})
export type AnalyticsProjectReportItem = Static<typeof AnalyticsProjectReportItem>

export const AnalyticsProjectReport = Type.Array(AnalyticsProjectReportItem)
export type AnalyticsProjectReport = Static<typeof AnalyticsProjectReport>

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
    runs: Type.Number(),
    timeSavedPerRun: Type.Object({
        value: Nullable(Type.Number()),
        isEstimated: Type.Boolean(),    
    }),
    minutesSaved: Type.Number(),
})
export type AnalyticsFlowReportItem = Static<typeof AnalyticsFlowReportItem>

export const AnalyticsFlowReport = Type.Array(AnalyticsFlowReportItem)
export type AnalyticsFlowReport = Static<typeof AnalyticsFlowReport>

export const PlatformAnalyticsReport = Type.Object({
    ...BaseModelSchema,
    estimatedTimeSavedPerStep: Nullable(Type.Number()),
    totalFlows: Type.Number(),
    activeFlows: Type.Number(),
    outdated: Type.Boolean(),
    totalUsers: Type.Number(),
    activeUsers: Type.Number(),
    totalProjects: Type.Number(),
    activeFlowsWithAI: Type.Number(),
    totalFlowRuns: Type.Number(),
    topPieces: AnalyticsPieceReport,
    topProjects: AnalyticsProjectReport,
    runsUsage: AnalyticsRunsUsage,
    flowsDetails: AnalyticsFlowReport,
    platformId: Type.String(),
})
export type PlatformAnalyticsReport = Static<typeof PlatformAnalyticsReport>

// Flow run analytics reports (custom)

export const GetAnalyticsParams = Type.Object({
    startDate: Type.String({ format: 'date' }),
    endDate: Type.String({ format: 'date' }),
})
export type GetAnalyticsParams = Static<typeof GetAnalyticsParams>

export const AnalyticsResponse = Type.Array(
    Type.Object({
        projectId: Type.String(),
        date: Type.String(),
        successfulFlowRuns: Type.Number(),
        failedFlowRuns: Type.Number(),
        successfulFlowRunsDuration: Type.Number(),
        failedFlowRunsDuration: Type.Number(),
    }),
)
export type AnalyticsResponse = Static<typeof AnalyticsResponse>

export const OverviewResponse = Type.Object({
    workflowCount: Type.Number(),
    activeWorkflowCount: Type.Number(),
    flowRunCount: Type.Number(),
})
export type OverviewResponse = Static<typeof OverviewResponse>
