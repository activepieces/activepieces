import { z } from 'zod'
import { FlowRunStatus } from '../../automation/flow-run/execution/flow-execution'
import { ApId } from '../common/id-generator'

export const PlatformMetricsReportRequest = z.object({
    createdAfter: z.string(),
    createdBefore: z.string(),
})

export const PlatformMetricsSummary = z.object({
    completed: z.number(),
    successRate: z.number(),
    previousCompleted: z.number(),
    previousSuccessRate: z.number(),
})

export const PlatformMetricsStatusPoint = z.object({
    day: z.string(),
    status: z.enum(FlowRunStatus),
    count: z.number(),
})

export const InternalErrorImpactItem = z.object({
    projectId: ApId,
    projectName: z.string(),
    flowId: ApId,
    flowName: z.string(),
    count: z.number(),
})

export const PlatformMetricsReport = z.object({
    summary: PlatformMetricsSummary,
    statusTimeseries: z.array(PlatformMetricsStatusPoint),
    internalErrors: z.array(InternalErrorImpactItem),
    nextRefreshAt: z.string(),
})

export const StuckJob = z.object({
    flowRunId: ApId,
    flowId: ApId,
    flowName: z.string(),
    projectId: ApId,
    projectName: z.string(),
    status: z.enum(FlowRunStatus),
})

export const PlatformMetricsLive = z.object({
    running: z.number(),
    queued: z.number(),
    stuckJobs: z.array(StuckJob),
})

export const PlatformMetricsHealthDay = z.object({
    day: z.string(),
    internalErrors: z.number(),
    affectedFlows: z.number(),
    stuckJobs: z.number(),
})

export const PlatformMetricsHealthHistory = z.object({
    days: z.array(PlatformMetricsHealthDay),
})

export type PlatformMetricsReportRequest = z.infer<typeof PlatformMetricsReportRequest>
export type PlatformMetricsSummary = z.infer<typeof PlatformMetricsSummary>
export type PlatformMetricsStatusPoint = z.infer<typeof PlatformMetricsStatusPoint>
export type InternalErrorImpactItem = z.infer<typeof InternalErrorImpactItem>
export type PlatformMetricsReport = z.infer<typeof PlatformMetricsReport>
export type StuckJob = z.infer<typeof StuckJob>
export type PlatformMetricsLive = z.infer<typeof PlatformMetricsLive>
export type PlatformMetricsHealthDay = z.infer<typeof PlatformMetricsHealthDay>
export type PlatformMetricsHealthHistory = z.infer<typeof PlatformMetricsHealthHistory>
