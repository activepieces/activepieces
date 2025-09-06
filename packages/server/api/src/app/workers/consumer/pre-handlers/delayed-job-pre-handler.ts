import { DelayedJobData, ExecutionType, isNil, JobData, ProgressUpdateType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { JobPreHandler, PreHandlerResult } from './index'

export const delayedJobPreHandler: JobPreHandler = {
    handle: async (job: JobData, _attemptsStarted: number, log: FastifyBaseLogger): Promise<PreHandlerResult> => {
        const delayedJob = job as DelayedJobData
        return resumeRunIfExists(delayedJob, log)
    },
}

async function resumeRunIfExists(delayedJob: DelayedJobData, log: FastifyBaseLogger): Promise<PreHandlerResult> {
    const { runId } = delayedJob
    const flowRun = await flowRunService(log).getOne({
        id: runId,
        projectId: delayedJob.projectId,
    })
    if (!isNil(flowRun)) {
        await flowRunService(log).start({
            payload: null,
            existingFlowRunId: flowRun.id,
            executeTrigger: false,
            synchronousHandlerId: delayedJob.synchronousHandlerId ?? undefined,
            projectId: delayedJob.projectId,
            flowVersionId: delayedJob.flowVersionId,
            executionType: ExecutionType.RESUME,
            httpRequestId: delayedJob.httpRequestId,
            environment: delayedJob.environment,
            progressUpdateType: delayedJob.progressUpdateType ?? ProgressUpdateType.NONE,
            parentRunId: flowRun.parentRunId,
            failParentOnFailure: flowRun.failParentOnFailure,
        })
    }
    return {
        shouldSkip: true,
        reason: 'Delayed jobs are handled by the app',
    }
}