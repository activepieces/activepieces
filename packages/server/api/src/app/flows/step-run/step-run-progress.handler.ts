import { 
    isNil, 
    ProjectId, 
    StepOutputStatus, 
    StepRunResponse,
    WebsocketClientEvent,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { flowRunService } from '../flow-run/flow-run-service'
import { exceptionHandler } from '@activepieces/server-shared'

function createProgressHandler(context: StepExecutionContext) {
    return async (progressEvent: FlowRunProgressEvent): Promise<void> => {
        const { socket, projectId, logger, stepName, requestId } = context
        
        if (progressEvent.runId !== context.runId) {
            return
        }

        try {
            const flowRun = await flowRunService(logger).getOnePopulatedOrThrow({
                id: progressEvent.runId,
                projectId,
            })
            
            const stepOutput = flowRun.steps[stepName]
            if (isNil(stepOutput) || [StepOutputStatus.RUNNING, StepOutputStatus.PAUSED].includes(stepOutput.status)) {
                return
            }
            
            if (stepOutput.status !== StepOutputStatus.SUCCEEDED) {
                const response: StepRunResponse = {
                    id: requestId,
                    success: false,
                    input: stepOutput.input ?? {},
                    output: stepOutput.output ?? {},
                    standardError: stepOutput.errorMessage as string,
                    standardOutput: '',
                }
                socket.emit(WebsocketClientEvent.TEST_STEP_FINISHED, response)
                throw new Error('Step execution failed')
            }
            
            const response: StepRunResponse = {
                id: requestId,
                success: true,
                input: stepOutput.input ?? {},
                output: stepOutput.output ?? {},
                standardError: '',
                standardOutput: '',
            }
            
            socket.emit(WebsocketClientEvent.TEST_STEP_FINISHED, response)
        }
        catch (error) {
            exceptionHandler.handle(error, logger)
        }
    }
} 

type FlowRunProgressEvent = {
    runId: string
}

type StepExecutionContext = {
    socket: Socket
    projectId: ProjectId
    logger: FastifyBaseLogger
    stepName: string
    requestId: string
    runId: string
}

export const stepRunProgressHandler = {
    createProgressHandler,
}

