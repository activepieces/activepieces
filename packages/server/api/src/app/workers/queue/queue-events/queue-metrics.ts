import { FastifyBaseLogger } from "fastify";
import { Job, QueueEvents } from "bullmq";
import { redisConnections } from "../../../database/redis";
import { JobData, WorkerJobStatus, WorkerJobType } from "@activepieces/shared";
import { bullMqQueue } from "../job-queue";
import { Redis } from "ioredis";

export const metricsRedisKey = (jobType: WorkerJobType, status: WorkerJobStatus) => `metrics:${jobType}:${status}`
export const jobStateRedisKey = (jobId: string) => `jobState:${jobId}`

export const queueMetrics = (log: FastifyBaseLogger, queueEvents: QueueEvents) => ({

    attach: () => {
        queueEvents.on("added", onAdded)
        queueEvents.on("delayed", onDelayed)
        queueEvents.on("active", onActive)
        queueEvents.on("failed", onFailed)
       
    },
    detach: () => {
        queueEvents.off("added", onAdded)
        queueEvents.off("delayed", onDelayed)
        queueEvents.off("active", onActive)
        queueEvents.off("failed", onFailed)
    }

})

const onAdded = (args: { jobId: string }) => updateJobState(args.jobId, WorkerJobStatus.QUEUED)

const onDelayed = (args: { jobId: string }) => updateJobState(args.jobId, WorkerJobStatus.DELAYED)

const onActive = (args: { jobId: string }) => updateJobState(args.jobId, WorkerJobStatus.ACTIVE)

const onFailed = (args: { jobId: string }) => updateJobState(args.jobId, WorkerJobStatus.FAILED, true)

const updateJobState = async (jobId: string, status: WorkerJobStatus, deleteState = false) => {
  const job = await bullMqQueue?.getJob(jobId)

  if (!job?.data.jobType) return

  const redis = await redisConnections.useExisting()
  
  status = (status === WorkerJobStatus.DELAYED && job?.attemptsMade > 0) ? WorkerJobStatus.RETRYING : status

  await decrPrevState(redis, job.data.jobType, jobId)

  await redis.incr(metricsRedisKey(job.data.jobType, status))
  
  if (deleteState) {
    await redis.del(jobStateRedisKey(jobId))
  } else {
    await redis.set(jobStateRedisKey(jobId), status)
  }
}

const decrPrevState = async (redis: Redis, jobType: WorkerJobType, jobId: string) => {
  const prevState = await redis.get(jobStateRedisKey(jobId))
  if (prevState) {
    await redis.decr(metricsRedisKey(jobType, prevState as WorkerJobStatus))
  }
}