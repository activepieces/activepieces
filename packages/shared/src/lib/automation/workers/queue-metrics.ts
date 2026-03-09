import { z } from 'zod'

export const WorkerJobStats = z.object({
    active: z.number(),
    delayed: z.number(),
    prioritized: z.number(),
    waiting: z.number(),
    'waiting-children': z.number(),
    completed: z.number(),
    failed: z.number(),
    paused: z.number(),
})

export type WorkerJobStats = z.infer<typeof WorkerJobStats>

export const QueueMetricsResponse = z.object({
    stats: WorkerJobStats,
})

export type QueueMetricsResponse = z.infer<typeof QueueMetricsResponse>
