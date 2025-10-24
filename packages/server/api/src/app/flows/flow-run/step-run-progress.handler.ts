import { exceptionHandler } from '@activepieces/server-shared'
import {
    FlowRunStatus,
    isNil,
    StepOutputStatus,
    StepRunResponse,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunLogsService } from './logs/flow-run-logs-service'

export const stepRunProgressHandler = (log: FastifyBaseLogger) => ({
    async extractStepResponse(params: NotifyStepFinishedParams): Promise<StepRunResponse | null> {
        try {
            const flowLogs = await flowRunLogsService(log).getLogs({
                logsFileId: params.logsFileId,
                projectId: params.projectId,
            })

            if (isNil(params.stepNameToTest)) {
                return null
            }

            const stepOutput = flowLogs?.executionState?.steps?.[params.stepNameToTest]

            const isSuccess = stepOutput?.status === StepOutputStatus.SUCCEEDED || stepOutput?.status === StepOutputStatus.PAUSED
            return {
                runId: params.runId,
                success: isSuccess,
                input: stepOutput?.input,
                output: stepOutput?.output,
                standardError: isSuccess ? '' : (stepOutput?.errorMessage as string),
                standardOutput: '',
            }
        }
        catch (error) {
            exceptionHandler.handle(error, log)
            return null
        }
    },
})

type NotifyStepFinishedParams = {
    logsFileId: string
    projectId: string
    status: FlowRunStatus
    runId: string
    stepNameToTest: string
}