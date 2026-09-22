import { isNil } from '@activepieces/core-utils'
import { FlowOperationStatus, JobData, PollingJobData, RenewWebhookJobData, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { triggerSourceRepo } from '../../../trigger/trigger-source/trigger-source-service'
import { InterceptorResult, InterceptorVerdict, JobInterceptor } from '../job-interceptor'
import { jobQueue } from '../job-queue'

const ZOMBIE_REPEATING_JOB_TYPES = [WorkerJobType.EXECUTE_POLLING, WorkerJobType.RENEW_WEBHOOK]

export const zombiePollingInterceptor: JobInterceptor = {
    async preDispatch({ jobData, log }): Promise<InterceptorResult> {
        if (!ZOMBIE_REPEATING_JOB_TYPES.includes(jobData.jobType)) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        const { flowId, flowVersionId } = jobData as PollingJobData | RenewWebhookJobData
        // An active trigger source exists only when the flow is enabled and this exact version is current.
        // If soft-deleted (disabled or re-published to a new version), findOneBy returns null.
        const activeTriggerSource = await triggerSourceRepo().findOneBy({ flowVersionId })
        const flowIsBeingDeleted = await flowRepo().existsBy({ id: flowId, operationStatus: FlowOperationStatus.DELETING })
        const triggerIsStillLive = !isNil(activeTriggerSource) && !flowIsBeingDeleted
        if (triggerIsStillLive) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        log.warn({ flow: { id: flowId }, flowVersion: { id: flowVersionId } }, '[zombiePollingInterceptor] No live trigger source — discarding repeat job (flow disabled, re-published, or deleted)')
        await jobQueue(log).removeRepeatingJob({ flowVersionId })
        return { verdict: InterceptorVerdict.DISCARD }
    },

    async onJobFinished(_params: { jobId: string, jobData: JobData, failed: boolean, log: FastifyBaseLogger }): Promise<void> {
        // Nothing to release
    },
}
