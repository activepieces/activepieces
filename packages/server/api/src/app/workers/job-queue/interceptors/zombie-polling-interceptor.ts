import { isNil, JobData, PollingJobData, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { triggerSourceRepo } from '../../../trigger/trigger-source/trigger-source-service'
import { InterceptorResult, InterceptorVerdict, JobInterceptor } from '../job-interceptor'
import { jobQueue } from '../job-queue'

export const zombiePollingInterceptor: JobInterceptor = {
    async preDispatch({ jobData, log }): Promise<InterceptorResult> {
        if (jobData.jobType !== WorkerJobType.EXECUTE_POLLING) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        const { flowVersionId } = jobData as PollingJobData
        // An active trigger source exists only when the flow is enabled and this exact version is current.
        // If soft-deleted (disabled or re-published to a new version), findOneBy returns null.
        const activeTriggerSource = await triggerSourceRepo().findOneBy({ flowVersionId })
        if (!isNil(activeTriggerSource)) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        log.warn({ flowVersionId }, '[zombiePollingInterceptor] No active trigger source — discarding repeat job (flow disabled, re-published, or deleted)')
        await jobQueue(log).removeRepeatingJob({ flowVersionId })
        return { verdict: InterceptorVerdict.DISCARD }
    },

    async onJobFinished(_params: { jobId: string, jobData: JobData, log: FastifyBaseLogger }): Promise<void> {
        // Nothing to release
    },
}
