import { FastifyBaseLogger } from "fastify"
import { bullMqQueue } from '../job-queue'
import { ExecuteFlowJobData, isNil, JobData, WorkerJobType } from "@activepieces/shared"
import { Job } from "bullmq"
import { flowVersionRepo } from "../../../flows/flow-version/flow-version.service"
import { In } from "typeorm"
import { accessTokenManager } from "../../../authentication/lib/access-token-manager"

const refillJobsWithEngineToken = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {

      if (isNil(bullMqQueue)) {
          throw new Error('BullMQ queue is not initialized')
      }

      const batchSize = 100
      let start = 0;
      let end = batchSize - 1;

      while (true) {
          const jobs = await bullMqQueue.getJobs(undefined, start, end);
          if (isNil(jobs) || jobs.length === 0) break;
          await handleBatch(jobs)
          start += batchSize;
          end += batchSize;
      }

      log.info(
          '[refillExecuteFlowJobs] Refilled execute flow jobs',
      )
      return
    }
})

export default refillJobsWithEngineToken


const handleBatch = async (jobs: Job<JobData>[]) => {
    const flowJobs: Job<ExecuteFlowJobData>[] = jobs.filter(job => job.data.jobType === WorkerJobType.EXECUTE_FLOW) as Job<ExecuteFlowJobData>[]
    let flowVersionIdToFlowId: Record<string, string> = {}

    if (flowJobs.length > 0) {
        const flowVersionIds = await flowVersionRepo().find({ 
          where: { id: In(flowJobs.map(job => job.data.flowVersionId)) },
          select: { id: true, flowId: true }
        })

        flowVersionIdToFlowId = flowVersionIds.reduce((acc, flowVersion) => ({ ...acc, [flowVersion.id]: flowVersion.flowId }), {})
    }

    await Promise.all(jobs.map(async job => job.updateData({
      ...job.data,
      engineToken: await generateToken(job),
      ...(job.data.jobType === WorkerJobType.EXECUTE_FLOW && { flowId: flowVersionIdToFlowId[job.data.flowVersionId] }),
    })))
}

const generateToken = async (job: Job<JobData>) => {
  return await accessTokenManager.generateEngineToken({
    jobId: job.id,
    projectId: job.data.projectId ?? "",
    platformId: job.data.platformId,
  })
}