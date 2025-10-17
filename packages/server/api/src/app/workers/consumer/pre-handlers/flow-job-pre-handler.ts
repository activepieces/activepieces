import { ExecuteFlowJobData, FlowRunStatus, JobData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { JobPreHandler, PreHandlerResult } from './index'

export const flowJobPreHandler: JobPreHandler = {
    handle: async (job: JobData, attemptsStarted: number, log: FastifyBaseLogger): Promise<PreHandlerResult> => {
        const oneTimeJob = job as ExecuteFlowJobData
        const { runId } = oneTimeJob
        
        flowRunService(log).updateRunStatusAsync({
            flowRunId: runId,
            status: FlowRunStatus.RUNNING,
        })

        const skipDeletionCheckForFirstAttemptExecutionSpeed = attemptsStarted === 0
        if (skipDeletionCheckForFirstAttemptExecutionSpeed) {
            return { shouldSkip: false }
        }

        const runExists = await flowRunService(log).existsBy(runId)

        if (!runExists) {
            return {
                shouldSkip: true,
                reason: 'Run was deleted',
            }
        }

        return { shouldSkip: false }
    },
} 

