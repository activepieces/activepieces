import { JobData, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { projectStatusService } from '../../../project/project-status.service'
import { InterceptorResult, InterceptorVerdict, JobInterceptor } from '../job-interceptor'

export const projectInactiveInterceptor: JobInterceptor = {
    async preDispatch({ jobData, log }): Promise<InterceptorResult> {
        if (jobData.jobType !== WorkerJobType.EXECUTE_POLLING) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        const inactive = await projectStatusService(log).isInactive({ projectId: jobData.projectId })
        if (!inactive) {
            return { verdict: InterceptorVerdict.ALLOW }
        }
        log.info(
            { project: { id: jobData.projectId }, flowVersion: { id: jobData.flowVersionId } },
            '[projectInactiveInterceptor] Discarding poll tick — project is inactive, scheduler kept for reactivation',
        )
        return { verdict: InterceptorVerdict.DISCARD }
    },

    async onJobFinished(_params: { jobId: string, jobData: JobData, failed: boolean, log: FastifyBaseLogger }): Promise<void> {
        return
    },
}
