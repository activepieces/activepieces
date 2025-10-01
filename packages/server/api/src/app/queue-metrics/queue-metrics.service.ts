import { WorkerJobStatItem, WorkerJobType, WorkerJobStatus } from "@activepieces/shared"
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from "../database/redis"
import { Redis } from "ioredis"
import { metricsRedisKey } from "../workers/queue/queue-events/queue-metrics"

export const queueMetricService = (log: FastifyBaseLogger) => ({

  getMetrics: async (): Promise<WorkerJobStatItem[]> => {
    const redis = await redisConnections.useExisting()

    const jobStats: WorkerJobStatItem[] = await Promise.all(
      Object.values(WorkerJobType).map(async jobType => ({
        jobType: jobType,
        stats: {
          [WorkerJobStatus.QUEUED]: await getStat(redis, jobType, WorkerJobStatus.QUEUED),
          [WorkerJobStatus.DELAYED]: await getStat(redis, jobType, WorkerJobStatus.DELAYED),
          [WorkerJobStatus.RETRYING]: await getStat(redis, jobType, WorkerJobStatus.RETRYING),
          [WorkerJobStatus.ACTIVE]: await getStat(redis, jobType, WorkerJobStatus.ACTIVE),
          [WorkerJobStatus.FAILED]: await getStat(redis, jobType, WorkerJobStatus.FAILED),
          [WorkerJobStatus.THROTTLED]: await getStat(redis, jobType, WorkerJobStatus.THROTTLED)
        }
      }))
    )

    return jobStats
  },

})

const getStat = async (redis: Redis, jobType: WorkerJobType, status:WorkerJobStatus ) => {
  return Number(await redis.get(metricsRedisKey(jobType, status)))
}
