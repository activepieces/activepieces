import { isNil } from '@activepieces/core-utils'
import { EngineResponse, EngineResponseStatus, ExecuteActionOperation, ExecuteActionResponse, StepOutputStatus } from '@activepieces/shared'
import { pieceRunStepRunner } from '../handler/piece-run-step-runner'

export const actionOperation = {
    execute: async (operation: ExecuteActionOperation): Promise<EngineResponse<ExecuteActionResponse>> => {
        const stepOutput = await pieceRunStepRunner.run({ step: operation.step, operation })
        const success = stepOutput.status === StepOutputStatus.SUCCEEDED
        return {
            status: EngineResponseStatus.OK,
            response: {
                success,
                input: stepOutput.input,
                output: stepOutput.output,
                message: success || isNil(stepOutput.errorMessage) ? undefined : String(stepOutput.errorMessage),
            },
        }
    },
}
