import { FastifyBaseLogger } from "fastify"
import { bullMqQueue } from '../job-queue'
import { ExecuteFlowJobData, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, WorkerJobType } from "@activepieces/shared"
import { Job } from "bullmq"
import { flowVersionRepo } from "../../../flows/flow-version/flow-version.service"
import { In } from "typeorm"
import { accessTokenManager } from "../../../authentication/lib/access-token-manager"
import { redisConnections } from "../../../database/redis"

const REFILL_JOBS_WITH_ENGINE_TOKEN_KEY = 'migration:refill_jobs_with_engine_token'

export const refillJobsWithEngineToken = (log: FastifyBaseLogger) => ({
  async run(): Promise<void> {
    const redisConnection = await redisConnections.useExisting()
    const isMigrated = await redisConnection.get(REFILL_JOBS_WITH_ENGINE_TOKEN_KEY)
    if (!isNil(isMigrated)) {
      log.info('[refillJobsWithEngineToken] Already migrated, skipping')
      return
    }
    if (isNil(bullMqQueue)) {
      throw new Error('BullMQ queue is not initialized')
    }

    const batchSize = 1000

    let start = 0;
    let migratedJobs = 0
    while (true) {
      const jobs = await bullMqQueue.getJobs(undefined, start, start + batchSize);
      if (isNil(jobs) || jobs.length === 0) {
        break;
      }
      const filteredJobs = jobs.filter(job => job.data.schemaVersion === LATEST_JOB_DATA_SCHEMA_VERSION)
      const flowJobs: Job<ExecuteFlowJobData>[] = filteredJobs.filter(job => job.data.jobType === WorkerJobType.EXECUTE_FLOW) as Job<ExecuteFlowJobData>[]
      let flowVersionIdToFlowId: Record<string, string> = {}
      if (flowJobs.length > 0) {
        const flowVersionIds = await flowVersionRepo().find({
          where: { id: In(flowJobs.map(job => job.data.flowVersionId)) },
          select: { id: true, flowId: true }
        })

        flowVersionIdToFlowId = flowVersionIds.reduce((acc, flowVersion) => ({ ...acc, [flowVersion.id]: flowVersion.flowId }), {})
      }
      const promises = filteredJobs.map(async job => {
        const engineToken = await accessTokenManager.generateEngineToken({
          jobId: job.id,
          projectId: job.data.projectId!,
          platformId: job.data.platformId,
        })
        return job.updateData({
          ...job.data,
          engineToken,
          ...(job.data.jobType === WorkerJobType.EXECUTE_FLOW && { flowId: flowVersionIdToFlowId[job.data.flowVersionId] }),
        })
      })
      await Promise.all(promises)
      if (filteredJobs.length > 0) {
        migratedJobs += filteredJobs.length
      }
      start += batchSize;
    }

    log.info(
      '[refillJobsWithEngineToken] Refilled jobs with engine token and execute flow jobs with flowId',
    )
    if (migratedJobs === 0) {
      await redisConnection.set(REFILL_JOBS_WITH_ENGINE_TOKEN_KEY, 'true')
    }
  }
})


