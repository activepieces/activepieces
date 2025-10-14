import { ExecuteFlowJobData, isNil, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { JobsBatch } from '../helpers/jobs-batch'
import { Job } from 'bullmq'
import { flowVersionRepo } from '../../../flows/flow-version/flow-version.service'
import { In } from 'typeorm'
import { bullMqQueue } from '../job-queue'

export const refillExecuteFlowJobs = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        if (isNil(bullMqQueue)) {
            throw new Error('BullMQ queue is not initialized')
        }

        const jobsBatch = new JobsBatch<Job>(100)
        await jobsBatch.proccess(bullMqQueue, handleBatch)

        log.info(
            '[refillExecuteFlowJobs] Refilled execute flow jobs',
        )
        return
    },
})

const handleBatch = async (jobs: Job[]) => {
    const flowJobs: Job<ExecuteFlowJobData>[] = jobs.filter(job => job.data.jobType === WorkerJobType.EXECUTE_FLOW)
    if (flowJobs.length === 0) return Promise.resolve();

    const flowVersionIds = await flowVersionRepo().find({ 
        where: { id: In(flowJobs.map(job => job.data.flowVersionId)) },
        select: { id: true, flowId: true }
    })
    const flowVersionIdToFlowId = flowVersionIds.reduce((acc, flowVersion) => ({ ...acc, [flowVersion.id]: flowVersion.flowId }), {} as Record<string, string>)

    await Promise.all(flowJobs.map(job => job.updateData({
      ...job.data,
      flowId: flowVersionIdToFlowId[job.data.flowVersionId],
    })))
}
