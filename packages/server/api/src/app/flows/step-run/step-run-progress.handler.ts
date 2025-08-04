import { exceptionHandler } from '@activepieces/server-shared'
import { 
    FlowVersion, 
    isNil, 
    ProjectId, 
    StepOutput, 
    StepOutputStatus,
    StepRunResponse,
    WebsocketClientEvent,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { flowRunService } from '../flow-run/flow-run-service'

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
            
            const stepOutput = flowRun.steps ? findStepOutputInNestedStructure(flowRun.steps, stepName) : undefined
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


const findStepOutputInNestedStructure = (data: unknown, stepName: string): StepOutput | undefined => {
    if (isNil(data) || typeof data !== 'object') {
        return undefined
    }
    
    const dataAsRecord = data as Record<string, unknown>
    
    const foundStepOutput = !isNil(dataAsRecord[stepName]) && typeof dataAsRecord[stepName] === 'object'
    if (foundStepOutput) {
        return dataAsRecord[stepName] as StepOutput
    }
    
    for (const [, value] of Object.entries(dataAsRecord)) {
        if (value && typeof value === 'object') {
            const result = findStepOutputInNestedStructure(value, stepName)
            if (result) {
                return result
            }
        }
    }
    return undefined
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
    flowVersion: FlowVersion
}

export const stepRunProgressHandler = {
    createProgressHandler,
}

