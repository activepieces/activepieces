import { isNil, QueueMetricsResponse, WorkerJobStats } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue } from '../job-queue'

export const queueMetricService = (log: FastifyBaseLogger) => ({
    getMetrics: async (): Promise<QueueMetricsResponse> => {
        const sharedQueue = jobQueue(log).getSharedQueue()
        if (isNil(sharedQueue)) {
            throw Error('BullMQ queue is not initialized')
        }
        const counts = await sharedQueue.getJobCounts()
        return {
            stats: counts as WorkerJobStats,
        }
    },
})

