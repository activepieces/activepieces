import { emitWithAck, EngineGenericError, EngineSocketEvent, GetStepOutputRequest, isNil, SaveStepOutputRequest, StepExecutionPath, StepOutput, tryCatch } from '@activepieces/shared'
import { workerSocket } from '../worker-socket'


export type GetStepOutputResponse = {
    stepOutput: StepOutput | null
}

export const flowStateService = {
  
    saveStepOutput: async (request: SaveStepOutputRequest): Promise<void> => {
        
        try {
            await workerSocket.sendToWorkerWithAck(EngineSocketEvent.SAVE_STEP_OUTPUT, request)
        } catch (error) {
            throw new EngineGenericError(
                'FlowStateServiceError',
                `Failed to save step output: ${request.stepName} for run: ${request.runId}`,
                error,
            )
        } 
    },

    getStepOutputOrThrow: async (request: GetStepOutputRequest): Promise<StepOutput> => {
        const { error, data } = await tryCatch(() =>
          workerSocket.sendToWorkerWithAck<GetStepOutputResponse>(
                EngineSocketEvent.GET_STEP_OUTPUT,
                request,
            )
        )
        if (error || isNil(data?.stepOutput)) {
            throw new EngineGenericError(
                'FlowStateServiceError',
                `Failed to get step output: ${request.stepName} for run: ${request.runId}`,
                error,
            )
        }
        return data.stepOutput
    },
}

