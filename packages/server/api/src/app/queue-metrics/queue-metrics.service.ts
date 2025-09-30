import { WorkerJobStatItem, WorkerJobType, WorkerJobStatus } from "@activepieces/shared"
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from "../database/redis"
import { METRICS_KEY_PREFIX } from "../workers/queue/queue-events/save-queue-metrics"
import { Redis } from "ioredis"

export const queueMetricService = (log: FastifyBaseLogger) => ({

  getMetrics: async (): Promise<WorkerJobStatItem[]> => {
    const redis = await redisConnections.useExisting()

    const jobStats: WorkerJobStatItem[] = await Promise.all(
      Object.values(WorkerJobType).map(async jobType => ({
        jobType: jobType,
        stats: {
          failed: await getStat(redis, jobType, WorkerJobStatus.FAILED),
          active: await getStat(redis, jobType, WorkerJobStatus.ACTIVE),
          delayed: await getStat(redis, jobType, WorkerJobStatus.DELAYED),
          retried: await getStat(redis, jobType, WorkerJobStatus.DELAYED),
          throttled: await getStat(redis, jobType, WorkerJobStatus.DELAYED)
        }
      }))
    )

    return jobStats
  },

})

const getStat = async (redis: Redis, jobType: WorkerJobType, status:WorkerJobStatus ) => {
  return Number(await redis.get(`${METRICS_KEY_PREFIX(jobType)}:${status}`))
}
