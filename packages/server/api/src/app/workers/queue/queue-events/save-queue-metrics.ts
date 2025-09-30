import { FastifyBaseLogger } from "fastify";
import { Job, Queue, QueueEvents } from "bullmq";
import { EventsManager } from "./events-manager";
import { redisConnections } from "../../../database/redis";
import { JobData, WorkerJobStatus, WorkerJobType } from "@activepieces/shared";
import { QueueName } from "@activepieces/server-shared";
import { bullMqGroups } from "../job-queue";
import { Redis } from "ioredis";

export const METRICS_KEY = "metrics"
export const JOB_STATE_KEY = "job_state"

export const METRICS_KEY_PREFIX = (jobType: WorkerJobType) => `${METRICS_KEY}:${jobType}`
export const JOB_STATE_KEY_PREFIX = (jobId: string) => `${JOB_STATE_KEY}:${jobId}`

export const saveQueueMetrics = (log: FastifyBaseLogger, queueEvents: QueueEvents): EventsManager => ({

    attach: () => {
        queueEvents.on("waiting", onWaiting)
        queueEvents.on("failed", onFailed)
        queueEvents.on("completed", onCompleted)
       
    },
    detach: () => {
        queueEvents.off("waiting", onWaiting)
        queueEvents.off("failed", onFailed)
        queueEvents.off("completed", onCompleted)
    }

})

const onWaiting = async (args: { jobId: string, prev?: string }) => {
  const queue = bullMqGroups[QueueName.WORKER_JOBS].queue
  const job = await queue.getJob(args.jobId)
  if (!job?.data.jobType) return

  const redisConnectionInstance = await redisConnections.useExisting()

  
  await decrPrevState(redisConnectionInstance, job.data.jobType, args.jobId)

  await redisConnectionInstance.incr(`${METRICS_KEY_PREFIX(job.data.jobType)}:${WorkerJobStatus.DELAYED}`)
  
  await redisConnectionInstance.set(JOB_STATE_KEY_PREFIX(args.jobId), WorkerJobStatus.DELAYED)
}

const onFailed = async (args: { jobId: string }) => {
  const queue = bullMqGroups[QueueName.WORKER_JOBS].queue
  const job: Job<JobData> = await queue.getJob(args.jobId)
  if (!job?.data.jobType) return

  const redisConnectionInstance = await redisConnections.useExisting()
  
  await decrPrevState(redisConnectionInstance, job.data.jobType, args.jobId)

  await redisConnectionInstance.incr(`${METRICS_KEY_PREFIX(job.data.jobType)}:${WorkerJobStatus.FAILED}`)
  
  await redisConnectionInstance.del(JOB_STATE_KEY_PREFIX(args.jobId))
}

const onCompleted = async (args: { jobId: string }) => {
  const queue = bullMqGroups[QueueName.WORKER_JOBS].queue
  const job = await queue.getJob(args.jobId)
  if (!job?.data.jobType) return

  const redisConnectionInstance = await redisConnections.useExisting()
  
  await decrPrevState(redisConnectionInstance, job.data.jobType, args.jobId)

  await redisConnectionInstance.incr(`${METRICS_KEY_PREFIX(job.data.jobType)}:${WorkerJobStatus.COMPLETED}`)
  
  await redisConnectionInstance.del(JOB_STATE_KEY_PREFIX(args.jobId))
}

const decrPrevState = async (redisConnectionInstance: Redis, jobType: WorkerJobType, jobId: string) => {
  const prevState = await redisConnectionInstance.get(JOB_STATE_KEY_PREFIX(jobId))
  if (prevState) {
    await redisConnectionInstance.decr(`${METRICS_KEY_PREFIX(jobType)}:${prevState}`)
  }
}