import { exceptionHandler } from '@activepieces/server-shared'
import { 
    FlowRunId,
    isNil, 
    PauseType, 
    StepOutput, 
    StepOutputStatus,
    StepRunResponse,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineResponseWatcher } from '../../workers/engine-response-watcher'
import { flowRunService } from './flow-run-service'


export const stepRunProgressHandler = {
    async notifyStepFinished(params: NotifyStepFinishedParams): Promise<void> {
        const { runId, logger } = params
        try {
            const flowRun = await getFlowRun(runId, logger)
            
            const stepOutput = flowRun.stepNameToTest 
                ? flowRun.steps[flowRun.stepNameToTest]
                : undefined

            const shouldStopProcessingStepCompletion = isNil(stepOutput) || [StepOutputStatus.RUNNING, StepOutputStatus.PAUSED].includes(stepOutput.status)
            if (shouldStopProcessingStepCompletion) {
                return
            }

            if (flowRun.pauseMetadata?.type !== PauseType.WEBHOOK) {
                return
            }

            const { testCallbackRequestId, handlerId } = flowRun.pauseMetadata
            if (isNil(handlerId) || isNil(testCallbackRequestId)) {
                return
            }

            const response = createStepRunResponse(stepOutput, testCallbackRequestId)
            await engineResponseWatcher(logger).publish(testCallbackRequestId, handlerId, response)
        }
        catch (error) {
            exceptionHandler.handle(error, logger)
        }
    },
}

async function getFlowRun(runId: FlowRunId, logger: FastifyBaseLogger) {
    let flowRun = await flowRunService(logger).getOnePopulatedOrThrow({
        id: runId,
        projectId: undefined,
    })
    
    if (!isNil(flowRun.parentRunId)) {
        flowRun = await flowRunService(logger).getOnePopulatedOrThrow({
            id: flowRun.parentRunId,
            projectId: undefined,
        })
    }
    
    return flowRun
}

function createStepRunResponse(stepOutput: StepOutput, testCallbackRequestId: string): StepRunResponse {
    const isSuccess = stepOutput.status === StepOutputStatus.SUCCEEDED
    
    return {
        id: testCallbackRequestId,
        success: isSuccess,
        input: stepOutput.input ?? {},
        output: stepOutput.output ?? {},
        standardError: isSuccess ? '' : (stepOutput.errorMessage as string),
        standardOutput: '',
    }
}

type NotifyStepFinishedParams = {
    runId: FlowRunId
    logger: FastifyBaseLogger
}