import { isNil, QueueMetricsResponse, WorkerJobStats } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { bullMqQueue } from '../workers/queue/job-queue'

export const queueMetricService = (_log: FastifyBaseLogger) => ({
    getMetrics: async (): Promise<QueueMetricsResponse> => {
        if (isNil(bullMqQueue)) {
            throw Error("BullMQ queue is not initialized")
        }
        const counts = await bullMqQueue.getJobCounts()
        return {
            stats: counts as WorkerJobStats,
        }
    },
})

