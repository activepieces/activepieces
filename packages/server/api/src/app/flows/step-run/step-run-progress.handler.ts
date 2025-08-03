import { 
    ExecutioOutputFile, 
    isNil, 
    ProjectId, 
    StepOutputStatus, 
    StepRunResponse,
    WebsocketClientEvent
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { fileService } from '../../file/file.service'
import { flowService } from '../flow/flow.service'
import { flowRunService } from '../flow-run/flow-run-service'

async function executeSubflow(params: SubflowExecutionParams) {
    const { externalFlowId, projectId, input, returnResponseActionPattern, log } = params
    
    const flowSearchResult = await flowService(log).list({
        externalIds: [externalFlowId],
        projectId,
        cursorRequest: null,
        limit: 1,
        folderId: undefined,
        status: undefined,
        name: undefined,
    })
    
    if (flowSearchResult.data.length === 0) {
        throw new Error('Subflow not found')
    }
    
    return await flowRunService(log).test({
        projectId,
        flowVersionId: flowSearchResult.data[0].version.id,
        payload: input,
        returnResponseActionPattern,
    })
}

function createProgressHandler(context: StepExecutionContext) {
    return async (progressEvent: FlowRunProgressEvent): Promise<void> => {
        const { socket, principal, logger, stepName, requestId } = context
        
        if (progressEvent.runId !== context.runId) {
            return
        }

        try {
            const flowRun = await flowRunService(logger).getOneOrThrow({
                id: progressEvent.runId,
                projectId: principal.projectId,
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

type SubflowExecutionParams = {
    externalFlowId: string
    projectId: ProjectId
    input: unknown
    returnResponseActionPattern: string | undefined
    log: FastifyBaseLogger
}

type FlowRunProgressEvent = {
    runId: string
}

type StepExecutionContext = {
    socket: any
    principal: any
    logger: FastifyBaseLogger
    stepName: string
    requestId: string
    runId: string
}

export const stepRunProgressHandler = {
    executeSubflow,
    createProgressHandler,
}

