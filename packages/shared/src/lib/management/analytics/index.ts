import { z } from 'zod'
import { FlowStatus } from '../../automation/flows/flow'
import { BaseModelSchema, DateOrString, Nullable } from '../../core/common/base-model'
import { UserWithMetaInformation } from '../../core/user'

export enum AnalyticsTimePeriod {
    LAST_WEEK = 'last-week',
    LAST_MONTH = 'last-month',
    LAST_THREE_MONTHS = 'last-three-months',
    LAST_SIX_MONTHS = 'last-six-months',
    LAST_YEAR = 'last-year',
}

export const AnalyticsRunsUsageItem = z.object({
    day: z.string(),
    flowId: z.string(),
    runs: z.number(),
})
export type AnalyticsRunsUsageItem = z.infer<typeof AnalyticsRunsUsageItem>

export const AnalyticsRunsUsage = z.array(AnalyticsRunsUsageItem)
export type AnalyticsRunsUsage = z.infer<typeof AnalyticsRunsUsage>

export const AnalyticsFlowReportItem = z.object({
    flowId: z.string(),
    flowName: z.string(),
    projectId: z.string(),
    projectName: z.string(),
    status: z.nativeEnum(FlowStatus),
    timeSavedPerRun: Nullable(z.number()),
    ownerId: Nullable(z.string()),
})
export type AnalyticsFlowReportItem = z.infer<typeof AnalyticsFlowReportItem>

export const AnalyticsFlowReport = z.array(AnalyticsFlowReportItem)
export type AnalyticsFlowReport = z.infer<typeof AnalyticsFlowReport>

export const PlatformAnalyticsReport = z.object({
    ...BaseModelSchema,
    cachedAt: DateOrString,
    runs: AnalyticsRunsUsage,
    outdated: z.boolean(),
    flows: AnalyticsFlowReport,
    platformId: z.string(),
    users: z.array(UserWithMetaInformation),
})
export type PlatformAnalyticsReport = z.infer<typeof PlatformAnalyticsReport>

export const ProjectLeaderboardItem = z.object({
    projectId: z.string(),
    projectName: z.string(),
    flowCount: z.number(),
    minutesSaved: Nullable(z.number()),
})
export type ProjectLeaderboardItem = z.infer<typeof ProjectLeaderboardItem>

export const UserLeaderboardItem = z.object({
    userId: z.string(),
    flowCount: z.number(),
    minutesSaved: Nullable(z.number()),
})
export type UserLeaderboardItem = z.infer<typeof UserLeaderboardItem>

export const AnalyticsReportRequest = z.object({
    timePeriod: z.nativeEnum(AnalyticsTimePeriod).optional(),
})
export type AnalyticsReportRequest = z.infer<typeof AnalyticsReportRequest>

export const LeaderboardRequest = z.object({
    timePeriod: z.nativeEnum(AnalyticsTimePeriod),
})
export type LeaderboardRequest = z.infer<typeof LeaderboardRequest>
