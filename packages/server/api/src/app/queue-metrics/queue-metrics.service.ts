import { WorkerJobStatItem, WorkerJobStats, WorkerJobType, JobData, isNil, WorkerJobStatus } from "@activepieces/shared"
import { Job, Queue } from "bullmq"
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

  // listJobs: async ({status, limit, page, jobType}: ListParams): Promise<any> => {
  //   const queue = new Queue("workerJobs")

  //   const jobs: Job<JobData>[] = await queue.getJobs();
  //   const filteredJobs: Job<JobData>[] = [];
  //   const jobStats: WorkerJobStatItem[] = Object.values(WorkerJobType).map(jobType => ({
  //       jobType: jobType,
  //       stats: {
  //         failed: 0,
  //         active: 0,
  //         delayed: 0,
  //         retried: 0,
  //         throttled: 0
  //       }
  //   }))

  //   for (const job of jobs) {
  //     const currJobType = job.data.jobType || WorkerJobType.EXECUTE_FLOW
  //     const typeIndex = jobStats.findIndex(stats => stats.jobType === currJobType)
  //     const stats = jobStats[typeIndex].stats
  //     const currJobStatus = await getJobStatus(job)

  //     const newStats = {
  //       ...stats,
  //       [currJobStatus]: stats[currJobStatus] + 1
  //     }

  //     jobStats[typeIndex].stats = newStats

  //     if (
  //       (isNil(jobType) || currJobType === jobType) &&
  //       (isNil(status) || currJobStatus === status)
  //     ) {
  //       filteredJobs.push(job)
  //     }
  //   }

  //   return {
  //     jobs: filteredJobs,
  //     jobStats: jobStats
  //   }
  // },

})

const getStat = async (redis: Redis, jobType: WorkerJobType, status:WorkerJobStatus ) => {
  return Number(await redis.get(`${METRICS_KEY_PREFIX(jobType)}:${status}`))
}

// const filterJobsByJobType = (jobs: Job[], jobType: WorkerJobType) => {
//   return jobs.filter(job => job.data.jobType === jobType)
// }

// const filterJobsByStatus = async (jobs: Job[], status: string) => {
//   switch (status) {
//     case "failed":
//       return jobs.filter(async job => await job.isFailed())
//     case "active":
//       return jobs.filter(async job => await job.isActive())
//     case "delayed":
//     case "retried":
//       case "throttled":
//       return jobs.filter(async job => await job.isDelayed())
//     default:
//       return jobs
//   }
// }

// const getJobStatus = async (job: Job) => {
//   // TODO
//   if (await job.isFailed()) {
//     return "failed"
//   }
//   if (await job.isActive()) {
//     return "active"
//   }
//   if (await job.isDelayed()) {
//     return "delayed"
//   }
//   if (await job.attemptsMade > 0) {
//     // return "queued"
//   }
//   return true ? "throttled" : "retried"
// }

type ListParams = {
  status?: string
  limit?: number
  page: number
  jobType?: WorkerJobType
}

type GetJobParams = {
  id: string
}
