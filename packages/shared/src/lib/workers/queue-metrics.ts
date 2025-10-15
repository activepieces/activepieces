import { JobState } from 'bullmq'

export type WorkerJobStats = Record<JobState, number>

export type QueueMetricsResponse = {
    stats: WorkerJobStats
}
