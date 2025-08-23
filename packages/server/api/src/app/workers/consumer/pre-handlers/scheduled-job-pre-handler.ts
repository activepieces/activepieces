import { DelayedJobData, JobData, RepeatableJobType, ScheduledJobData } from '@activepieces/server-shared'
import { ExecutionType, FlowStatus, isNil, ProgressUpdateType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../../flows/flow/flow.service'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { jobQueue } from '../../queue'
import { JobPreHandler, PreHandlerResult } from './index'


export const scheduledJobPreHandler: JobPreHandler = {
    handle: async (job: JobData, _attemptsStarted: number, log: FastifyBaseLogger): Promise<PreHandlerResult> => {
        const scheduledJob = job as ScheduledJobData | DelayedJobData

        if (scheduledJob.jobType === RepeatableJobType.DELAYED_FLOW) {
            return resumeRunIfExists(scheduledJob, log)
        }

        const flow = await flowService(log).getOneById(scheduledJob.flowId)
        if (isNil(flow) || flow?.status === FlowStatus.DISABLED || flow?.publishedVersionId !== scheduledJob.flowVersionId) {
            log.info({
                message: '[WorkerController#removeScheduledJob]',
                flowVersionId: scheduledJob.flowVersionId,
            }, 'removing stale scheduled job')
            await jobQueue(log).removeRepeatingJob({
                flowVersionId: scheduledJob.flowVersionId,
            })
            return {
                shouldSkip: true,
                reason: 'Flow is disabled or version mismatch',
            }
        }

        return { shouldSkip: false }
    },
}



async function resumeRunIfExists(scheduledJob: DelayedJobData, log: FastifyBaseLogger): Promise<PreHandlerResult> {
    const { runId } = scheduledJob
    const flowRun = await flowRunService(log).getOne({
        id: runId,
        projectId: scheduledJob.projectId,
    })
    if (!isNil(flowRun)) {
        await flowRunService(log).start({
            payload: null,
            existingFlowRunId: flowRun.id,
            executeTrigger: false,
            synchronousHandlerId: scheduledJob.synchronousHandlerId ?? undefined,
            projectId: scheduledJob.projectId,
            flowVersionId: scheduledJob.flowVersionId,
            executionType: ExecutionType.RESUME,
            httpRequestId: scheduledJob.httpRequestId,
            environment: scheduledJob.environment,
            progressUpdateType: scheduledJob.progressUpdateType ?? ProgressUpdateType.NONE,
            parentRunId: flowRun.parentRunId,
            failParentOnFailure: flowRun.failParentOnFailure,
        })
    }
    return {
        shouldSkip: true,
        reason: 'Delayed jobs are handled by the app',
    }
}