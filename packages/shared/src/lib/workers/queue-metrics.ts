import { Static, Type } from '@sinclair/typebox'
import { WorkerJobType } from './job-data'

export enum WorkerJobStatus {
    FAILED = 'failed',
    DELAYED = 'delayed',
    ACTIVE = 'active',
    QUEUED = 'queued',
    RETRYING = 'retrying',
}

export const WorkerJobTypeForMetrics = [
    WorkerJobType.RENEW_WEBHOOK,
    WorkerJobType.EXECUTE_POLLING,
    WorkerJobType.DELAYED_FLOW,
    WorkerJobType.EXECUTE_WEBHOOK,
    WorkerJobType.EXECUTE_FLOW,
    WorkerJobType.EXECUTE_AGENT,
    WorkerJobType.EXECUTE_TOOL,
] as const

export const WorkerJobStats = Type.Object({
    [WorkerJobStatus.ACTIVE]: Type.Number(),
    [WorkerJobStatus.QUEUED]: Type.Number(),
    [WorkerJobStatus.FAILED]: Type.Number(),
    [WorkerJobStatus.RETRYING]: Type.Number(),
    [WorkerJobStatus.DELAYED]: Type.Number(),
})

export type WorkerJobStats = Static<typeof WorkerJobStats>

export const QueueMetricsResponse = Type.Object({
    statsPerJobType: Type.Record(Type.Enum(WorkerJobType), WorkerJobStats),
    totalStats: WorkerJobStats,
})

export type QueueMetricsResponse = Static<typeof QueueMetricsResponse>