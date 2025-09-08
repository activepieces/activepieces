import { exceptionHandler } from '@activepieces/server-shared'
import {
    isFlowStateTerminal,
    isNil,
    StepOutputStatus,
    StepRunResponse,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunService } from './flow-run-service'

export const stepRunProgressHandler = (log: FastifyBaseLogger) => ({
    async extractStepResponse(params: NotifyStepFinishedParams): Promise<StepRunResponse | null> {
        try {
            const populatedFlowRun = await flowRunService(log).getOnePopulatedOrThrow({
                id: params.runId,
                projectId: undefined,
            })
            if (isNil(populatedFlowRun.stepNameToTest)) {
                return null
            }
            // In single-step execution mode, the engine executes the step directly without traverse the flow, which means the step will always be at the root level
            const stepOutput = populatedFlowRun.steps[populatedFlowRun.stepNameToTest]

            if (isNil(stepOutput) || !isFlowStateTerminal(populatedFlowRun.status)) {
                return null
            }

            const isSuccess = stepOutput.status === StepOutputStatus.SUCCEEDED || stepOutput.status === StepOutputStatus.PAUSED
            return {
                runId: params.runId,
                success: isSuccess,
                input: stepOutput.input,
                output: stepOutput.output,
                standardError: isSuccess ? '' : (stepOutput.errorMessage as string),
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
    runId: string
}