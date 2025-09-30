import { FastifyBaseLogger } from "fastify";
import { Job, Queue, QueueEvents } from "bullmq";
import { EventsManager } from "./events-manager";
import { redisConnections } from "../../../database/redis";
import { assertNotNullOrUndefined, WorkerJobStatus, WorkerJobType } from "@activepieces/shared";
import { QueueName } from "@activepieces/server-shared";
import { bullMqGroups } from "../job-queue";

export const METRICS_KEY = "metrics"
export const METRICS_KEY_PREFIX = (jobType: WorkerJobType) => `${METRICS_KEY}:${jobType}`

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

const onWaiting = async (args: { jobId: string }) => {
  const queue = bullMqGroups[QueueName.WORKER_JOBS].queue
  const job = await queue.getJob(args.jobId)
  if (!job?.data.jobType) return

  const redisConnectionInstance = await redisConnections.useExisting()
  await redisConnectionInstance.incr(`${METRICS_KEY_PREFIX(job.data.jobType)}:${WorkerJobStatus.DELAYED}`)
}

const onFailed = async (args: { jobId: string }) => {
  const queue = bullMqGroups[QueueName.WORKER_JOBS].queue
  const job = await queue.getJob(args.jobId)
  if (!job?.data.jobType) return

  const redisConnectionInstance = await redisConnections.useExisting()
  await redisConnectionInstance.incr(`${METRICS_KEY_PREFIX(job.data.jobType)}:${WorkerJobStatus.FAILED}`)
}

const onCompleted = async (args: { jobId: string }) => {
  const queue = bullMqGroups[QueueName.WORKER_JOBS].queue
  const job = await queue.getJob(args.jobId)
  if (!job?.data.jobType) return

  const redisConnectionInstance = await redisConnections.useExisting()
  await redisConnectionInstance.incr(`${METRICS_KEY_PREFIX(job.data.jobType)}:${WorkerJobStatus.COMPLETED}`)
}