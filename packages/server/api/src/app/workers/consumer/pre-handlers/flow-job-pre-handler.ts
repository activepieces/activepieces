import { ExecuteFlowJobData, FlowRunStatus, JobData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
// import { projectLimitsService } from '../../../ee/projects/project-plan/project-plan.service'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { JobPreHandler, PreHandlerResult } from './index'

export const flowJobPreHandler: JobPreHandler = {
    handle: async (job: JobData, attemptsStarted: number, log: FastifyBaseLogger): Promise<PreHandlerResult> => {
        const oneTimeJob = job as ExecuteFlowJobData
        const { runId, projectId } = oneTimeJob

        flowRunService(log).updateRunStatusAsync({
            flowRunId: runId,
            status: FlowRunStatus.RUNNING,
        })

        // const exceededLimit = await projectLimitsService(log).checkTasksExceededLimit(projectId)
        const exceededLimit = false
        if (exceededLimit) {
            await saveTriggerPayloadAndMarkQuotaExceeded(oneTimeJob, log)
            return {
                shouldSkip: true,
                reason: 'Quota limit exceeded',
            }
        }

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

async function saveTriggerPayloadAndMarkQuotaExceeded(oneTimeJob: ExecuteFlowJobData, log: FastifyBaseLogger): Promise<void> {
    const { runId, projectId, flowVersionId } = oneTimeJob
    const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
    const savedRun = await flowRunService(log).updateRun({
        flowRunId: runId,
        status: FlowRunStatus.QUOTA_EXCEEDED,
        projectId,
        tasks: 0,
        duration: 0,
        tags: [],
    })

    const payloadBuffer = JSON.stringify({
        executionState: {
            steps: {
                [flowVersion.trigger.name]: {
                    output: oneTimeJob.payload,
                    status: FlowRunStatus.SUCCEEDED,
                    type: 'PIECE_TRIGGER',
                },
            },
        },
    })
    await flowRunService(log).updateLogs({
        flowRunId: savedRun.id,
        logsFileId: savedRun.logsFileId ?? undefined,
        projectId,
        executionStateString: payloadBuffer,
        executionStateContentLength: payloadBuffer.length,
    })
}
