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
          queued: await getStat(redis, jobType, WorkerJobStatus.QUEUED),
          delayed: await getStat(redis, jobType, WorkerJobStatus.DELAYED),
          retried: await getStat(redis, jobType, WorkerJobStatus.RETRYING),
          active: await getStat(redis, jobType, WorkerJobStatus.ACTIVE),
          failed: await getStat(redis, jobType, WorkerJobStatus.FAILED),
          throttled: await getStat(redis, jobType, WorkerJobStatus.THROTTLED)
        }
      }))
    )

    return jobStats
  },

})

const getStat = async (redis: Redis, jobType: WorkerJobType, status:WorkerJobStatus ) => {
  return Number(await redis.get(metricsRedisKey(jobType, status)))
}
