import { QueueMetricsResponse, WorkerJobStats, WorkerJobStatus, WorkerJobType, WorkerJobTypeForMetrics } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Redis } from 'ioredis'
import { redisConnections } from '../database/redis'
import { metricsRedisKey } from '../workers/queue/queue-events/queue-metrics'

export const queueMetricService = (_log: FastifyBaseLogger) => ({

    getMetrics: async (): Promise<QueueMetricsResponse> => {
        const statsPerJobType = {} as QueueMetricsResponse['statsPerJobType']
        const totalStats = {} as QueueMetricsResponse['totalStats']

        const redis = await redisConnections.useExisting()

        for (const jobType of WorkerJobTypeForMetrics) {
            const jobStats = {} as WorkerJobStats

            for (const status of Object.values(WorkerJobStatus)) {
                jobStats[status] = await getStat(redis, jobType, status)
                totalStats[status] = (totalStats[status] ?? 0) + jobStats[status]
            }

            statsPerJobType[jobType] = jobStats
        }

        const response: QueueMetricsResponse = {
            statsPerJobType,
            totalStats,
        }

        return response
    },

})

const getStat = async (redis: Redis, jobType: WorkerJobType, status: WorkerJobStatus) => {
    return Number(await redis.get(metricsRedisKey(jobType, status)))
}
