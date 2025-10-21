import { isNil, QueueMetricsResponse, WorkerJobStats } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { sharedWorkerJobsQueue } from '../job-queue'

export const queueMetricService = (_log: FastifyBaseLogger) => ({
    getMetrics: async (): Promise<QueueMetricsResponse> => {
        if (isNil(sharedWorkerJobsQueue)) {
            throw Error('BullMQ queue is not initialized')
        }
        const counts = await sharedWorkerJobsQueue.getJobCounts()
        return {
            stats: counts as WorkerJobStats,
        }
    },
})

