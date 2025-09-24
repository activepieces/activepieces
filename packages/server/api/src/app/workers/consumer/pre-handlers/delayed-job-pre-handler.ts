import { DelayedJobData, ExecutionType, JobData, ProgressUpdateType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { JobPreHandler, PreHandlerResult } from './index'

export const delayedJobPreHandler: JobPreHandler = {
    handle: async (job: JobData, _attemptsStarted: number, log: FastifyBaseLogger): Promise<PreHandlerResult> => {
        const delayedJob = job as DelayedJobData
        const { runId } = delayedJob
        const flowRun = await flowRunService(log).getOneOrThrow({
            id: runId,
            projectId: delayedJob.projectId,
        })
        await flowRunService(log).resume({
            payload: null,
            flowRunId: flowRun.id,
            requestId: delayedJob.httpRequestId,
            progressUpdateType: delayedJob.progressUpdateType ?? ProgressUpdateType.NONE,
            executionType: ExecutionType.RESUME,
            checkRequestId: false,
        })
        return {
            shouldSkip: true,
            reason: 'Delayed jobs are handled by the app',
        }
    },
}
