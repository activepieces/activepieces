import { exceptionHandler } from '@activepieces/server-shared'
import {
    AGENT_PIECE_NAME,
    FlowRunStatus,
    isFlowRunStateTerminal,
    isNil,
    StepOutputStatus,
    StepRunResponse,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunLogsService } from './logs/flow-run-logs-service'

export const stepRunProgressHandler = (log: FastifyBaseLogger) => ({
    async extractStepResponse(params: NotifyStepFinishedParams): Promise<StepRunResponse | null> {
        try {
            const isAgentStep = params.stepNameToTest === AGENT_PIECE_NAME

            const flowLogs = await flowRunLogsService(log).getLogs({
                logsFileId: params.logsFileId,
                projectId: params.projectId,
            })

            if (isNil(params.stepNameToTest)) {
                return null
            }

            const stepOutput = flowLogs?.executionState?.steps?.[params.stepNameToTest]

            const isTerminalOutput = isFlowRunStateTerminal({
                status: params.status,
                ignoreInternalError: false,
            })
            
            if (!isAgentStep && (isNil(stepOutput) || !isTerminalOutput)) {
                return null
            }
            
            if (isAgentStep && isNil(stepOutput)) {
                return {
                    runId: params.runId,
                    success: false,
                    input: undefined,
                    output: undefined,
                    standardError: '',
                    standardOutput: '',
                }
            }

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
    isStepExecutionComplete(response: StepRunResponse, flowStatus: FlowRunStatus): boolean {
        const isTerminalFlowState = isFlowRunStateTerminal({
            status: flowStatus,
            ignoreInternalError: false,
        })
        
        const hasStepOutput = !isNil(response.output) || !isNil(response.standardError)
        return isTerminalFlowState || response.success || hasStepOutput
    },
})

type NotifyStepFinishedParams = {
    logsFileId: string
    projectId: string
    status: FlowRunStatus
    runId: string
    stepNameToTest: string
}