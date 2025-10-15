import { isNil, QueueMetricsResponse, WorkerJobStats } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerJobsQueue } from '../job-queue'

export const queueMetricService = (_log: FastifyBaseLogger) => ({
    getMetrics: async (): Promise<QueueMetricsResponse> => {
        if (isNil(workerJobsQueue)) {
            throw Error('BullMQ queue is not initialized')
        }
        const counts = await workerJobsQueue.getJobCounts()
        return {
            stats: counts as WorkerJobStats,
        }
    },
})

