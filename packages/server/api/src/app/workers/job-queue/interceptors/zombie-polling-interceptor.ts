import { isNil, JobData, PollingJobData, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { InterceptorResult, InterceptorVerdict, JobInterceptor } from '../job-interceptor'
import { jobQueue } from '../job-queue'

export const zombiePollingInterceptor: JobInterceptor = {
    async preDispatch({ jobData, log }): Promise<InterceptorResult> {
        if (jobData.jobType !== WorkerJobType.EXECUTE_POLLING) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        const { flowVersionId } = jobData as PollingJobData
        const flowVersion = await flowVersionService(log).getOne(flowVersionId)
        if (!isNil(flowVersion)) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        log.warn({ flowVersionId }, '[zombiePollingInterceptor] Flow version not found — discarding zombie repeat job')
        await jobQueue(log).removeRepeatingJob({ flowVersionId })
        return { verdict: InterceptorVerdict.DISCARD }
    },

    async onJobFinished(_params: { jobId: string, jobData: JobData, log: FastifyBaseLogger }): Promise<void> {
        // Nothing to release
    },
}
