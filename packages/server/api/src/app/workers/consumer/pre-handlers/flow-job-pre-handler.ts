import { ExecuteFlowJobData, FlowRunStatus, FlowStatus, isNil, JobData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { projectLimitsService } from '../../../ee/projects/project-plan/project-plan.service'
import { flowRunRepo, flowRunService } from '../../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { flowCache } from '../../../flows/flow/flow.cache'
import { JobPreHandler, PreHandlerResult } from './index'
import { flowRepo } from '../../../flows/flow/flow.repo'

export const flowJobPreHandler: JobPreHandler = {
    handle: async (job: JobData, attemptsStarted: number, log: FastifyBaseLogger): Promise<PreHandlerResult> => {
        const oneTimeJob = job as ExecuteFlowJobData
        const { runId, projectId, flowId } = oneTimeJob

        flowRunService(log).updateRunStatusAsync({
            flowRunId: runId,
            status: FlowRunStatus.RUNNING,
        })

        const exceededLimit = await projectLimitsService(log).checkTasksExceededLimit(projectId)
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

        let flowId_ = flowId

        if (isNil(flowId_)) {
            const flowRun = await flowRunRepo().findOneBy({ id: runId })
            if (isNil(flowRun)) {
                return {
                    shouldSkip: true,
                    reason: 'Flow run not found',
                }
            }
            flowId_ = flowRun?.flowId
        }

        const flowStatus = await flowCache(log).getStatusCache(flowId_)

        if (isNil(flowStatus)) {
            return {
                shouldSkip: true,
                reason: `Flow is deleted`,
            }
        }

        if (flowStatus === FlowStatus.DISABLED) {
            return {
                shouldSkip: true,
                reason: `Flow is disabled`,
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
