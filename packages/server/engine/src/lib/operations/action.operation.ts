import { isNil } from '@activepieces/core-utils'
import { EngineResponse, EngineResponseStatus, ExecuteActionOperation, ExecuteActionResponse, StepOutputStatus } from '@activepieces/shared'
import { adhocStepRunner } from '../handler/adhoc-step-runner'

export const actionOperation = {
    execute: async (operation: ExecuteActionOperation): Promise<EngineResponse<ExecuteActionResponse>> => {
        const stepOutput = await adhocStepRunner.run({ step: operation.step, operation })
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
