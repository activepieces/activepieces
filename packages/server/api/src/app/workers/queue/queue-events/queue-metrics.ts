import { FastifyBaseLogger } from "fastify";
import { Job, QueueEvents } from "bullmq";
import { redisConnections } from "../../../database/redis";
import { JobData, WorkerJobStatus, WorkerJobType } from "@activepieces/shared";
import { QueueName } from "@activepieces/server-shared";
import { bullMqGroups } from "../job-queue";
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

const onAdded = async (args: { jobId: string, prev?: string }) => {
  const queue = bullMqGroups[QueueName.WORKER_JOBS]
  const job = await queue.getJob(args.jobId)
  if (!job?.data.jobType) return

  const redisConnectionInstance = await redisConnections.useExisting()

  await decrPrevState(redisConnectionInstance, job.data.jobType, args.jobId)

  await redisConnectionInstance.incr(metricsRedisKey(job.data.jobType, WorkerJobStatus.QUEUED))
  
  await redisConnectionInstance.set(jobStateRedisKey(args.jobId), WorkerJobStatus.QUEUED)
}

const onDelayed = async (args: { jobId: string, prev?: string }) => {
  const queue = bullMqGroups[QueueName.WORKER_JOBS]
  const job = await queue.getJob(args.jobId)
  if (!job?.data.jobType) return

  const redisConnectionInstance = await redisConnections.useExisting()

  await decrPrevState(redisConnectionInstance, job.data.jobType, args.jobId)

  const status = job.attemptsMade > 0 ? WorkerJobStatus.RETRYING : WorkerJobStatus.DELAYED

  await redisConnectionInstance.incr(metricsRedisKey(job.data.jobType, status))
  
  await redisConnectionInstance.set(jobStateRedisKey(args.jobId), status)
}

const onActive = async (args: { jobId: string, prev?: string }) => {
  const queue = bullMqGroups[QueueName.WORKER_JOBS]
  const job = await queue.getJob(args.jobId)
  if (!job?.data.jobType) return

  const redisConnectionInstance = await redisConnections.useExisting()

  await decrPrevState(redisConnectionInstance, job.data.jobType, args.jobId)

  await redisConnectionInstance.incr(metricsRedisKey(job.data.jobType, WorkerJobStatus.ACTIVE))
  
  await redisConnectionInstance.set(jobStateRedisKey(args.jobId), WorkerJobStatus.ACTIVE)
} 

const onFailed = async (args: { jobId: string }) => {
  const queue = bullMqGroups[QueueName.WORKER_JOBS]
  const job: Job<JobData> = await queue.getJob(args.jobId)
  if (!job?.data.jobType) return

  const redisConnectionInstance = await redisConnections.useExisting()
  
  await decrPrevState(redisConnectionInstance, job.data.jobType, args.jobId)

  await redisConnectionInstance.incr(metricsRedisKey(job.data.jobType, WorkerJobStatus.FAILED))
  
  await redisConnectionInstance.del(jobStateRedisKey(args.jobId))
}


const decrPrevState = async (redisConnectionInstance: Redis, jobType: WorkerJobType, jobId: string) => {
  const prevState = await redisConnectionInstance.get(jobStateRedisKey(jobId))
  if (prevState) {
    await redisConnectionInstance.decr(metricsRedisKey(jobType, prevState as WorkerJobStatus))
  }
}