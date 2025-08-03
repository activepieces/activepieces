import { 
    ExecutioOutputFile, 
    isNil, 
    ProjectId, 
    StepOutputStatus, 
    StepRunResponse,
    WebsocketClientEvent,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { fileService } from '../../file/file.service'
import { flowRunService } from '../flow-run/flow-run-service'

function createProgressHandler(context: StepExecutionContext) {
    return async (progressEvent: FlowRunProgressEvent): Promise<void> => {
        const { socket, projectId, logger, stepName, requestId } = context
        
        if (progressEvent.runId !== context.runId) {
            return
        }

        try {
            const flowRun = await flowRunService(logger).getOneOrThrow({
                id: progressEvent.runId,
                projectId,
            })
            
            if (isNil(flowRun.logsFileId)) {
                return
            }

            const { data: fileData } = await fileService(logger).getDataOrThrow({
                fileId: flowRun.logsFileId,
                projectId: flowRun.projectId,
            })
            
            const executionData: ExecutioOutputFile = JSON.parse(fileData.toString('utf8'))
            const stepOutput = executionData.executionState.steps[stepName]
            
            if (isNil(stepOutput) || stepOutput.status === StepOutputStatus.RUNNING) {
                return
            }
            
            if (stepOutput.status !== StepOutputStatus.SUCCEEDED) {
                throw new Error('Step execution failed')
            }
            
            const response: StepRunResponse = {
                id: requestId,
                success: true,
                input: executionData.executionState.steps,
                output: stepOutput.output ?? {},
                standardError: '',
                standardOutput: '',
            }
            
            socket.emit(WebsocketClientEvent.TEST_STEP_FINISHED, response)
        }
        catch (error) {
            logger.error(error, '[handleFlowRunProgress]')
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

