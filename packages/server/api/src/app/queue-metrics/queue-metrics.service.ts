import { QueueMetricsResponse, WorkerJobStats, WorkerJobStatus, WorkerJobTypeForMetrics } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../database/redis-connections'
import { jobStatsRedisKeyPrefix, metricsRedisKey } from '../workers/queue/queue-events'

export const queueMetricService = (_log: FastifyBaseLogger) => ({

    getMetrics: async (): Promise<QueueMetricsResponse> => {
        const statsPerJobType = {} as QueueMetricsResponse['statsPerJobType']
        const totalStats = {} as QueueMetricsResponse['totalStats']

        const redis = await redisConnections.useExisting()

        const values = await redis.mget(getMetricsKeys())

        let i = 0
        for (const jobType of WorkerJobTypeForMetrics) {
            const jobStats = {} as WorkerJobStats

            for (const status of Object.values(WorkerJobStatus)) {
                jobStats[status] = Number(values[i]) ?? 0
                totalStats[status] = (totalStats[status] ?? 0) + jobStats[status]
                i++
            }

            statsPerJobType[jobType] = jobStats
        }

        const response: QueueMetricsResponse = {
            statsPerJobType,
            totalStats,
        }

        return response
    },

    resetMetrics: async (): Promise<{ message: string }> => {
        const redis = await redisConnections.useExisting()
        await redis.del(getMetricsKeys())
        await redis.del(`${jobStatsRedisKeyPrefix}:*`)

        return {
            message: 'Metrics reset successfully',
        }
    },
})

const getMetricsKeys = () => {
    return WorkerJobTypeForMetrics
        .flatMap(jobType => Object.values(WorkerJobStatus).map(status => metricsRedisKey(jobType, status)))
}
