import { Static, Type } from '@sinclair/typebox'

export const WorkerJobStats = Type.Object({
    active: Type.Number(),
    delayed: Type.Number(),
    prioritized: Type.Number(),
    waiting: Type.Number(),
    'waiting-children': Type.Number(),
    completed: Type.Number(),
    failed: Type.Number(),
    paused: Type.Number(),
})

export type WorkerJobStats = Static<typeof WorkerJobStats>

export const QueueMetricsResponse = Type.Object({
    stats: WorkerJobStats,
})

export type QueueMetricsResponse = Static<typeof QueueMetricsResponse>
