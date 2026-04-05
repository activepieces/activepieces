import { EngineResponseStatus, ExecuteFlowJobData, ExecuteTriggerHookJobData, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunRepo } from '../../../flows/flow-run/flow-run-service'
import { flowVersionRepo } from '../../../flows/flow-version/flow-version.service'
import { engineResponseWatcher } from '../../engine-response-watcher'
import { InterceptorResult, InterceptorVerdict, JobInterceptor } from '../job-interceptor'

export const deletedFlowInterceptor: JobInterceptor = {
    async preDispatch(): Promise<InterceptorResult> {
        return { verdict: InterceptorVerdict.ALLOW }
    },

    async onJobFinished({ jobData, log }): Promise<void> {
        if (jobData.jobType === WorkerJobType.EXECUTE_FLOW) {
            await handleExecuteFlowFinished(jobData as ExecuteFlowJobData, log)
        }
        else if (jobData.jobType === WorkerJobType.EXECUTE_TRIGGER_HOOK) {
            await handleExecuteTriggerHookFinished(jobData as ExecuteTriggerHookJobData, log)
        }
    },
}

async function handleExecuteFlowFinished(jobData: ExecuteFlowJobData, log: FastifyBaseLogger): Promise<void> {
    const flowRunExists = await flowRunRepo().existsBy({ id: jobData.runId })
    if (!flowRunExists) {
        log.warn({ runId: jobData.runId }, '[deletedFlowInterceptor] Flow run no longer exists after job completion — flow was deleted during execution')
    }
}

async function handleExecuteTriggerHookFinished(jobData: ExecuteTriggerHookJobData, log: FastifyBaseLogger): Promise<void> {
    const flowVersionExists = await flowVersionRepo().existsBy({ id: jobData.flowVersionId })
    if (!flowVersionExists) {
        log.warn({ flowVersionId: jobData.flowVersionId }, '[deletedFlowInterceptor] Flow version no longer exists after job completion — flow was deleted during execution')
        // Attempt to unblock any API-side listener still waiting — safe no-op if the response was already published
        await engineResponseWatcher(log).publish(jobData.webserverId, jobData.requestId, {
            status: EngineResponseStatus.TIMEOUT,
            response: undefined,
            error: 'Flow was deleted',
        })
    }
}
