import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteActionResponse,
    ExecuteToolOperation,
    FlowAction,
    FlowActionType,
    PropertyExecutionType,
    StepOutput,
    StepOutputStatus,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { ExecutionVerdict, FlowExecutorContext } from '../handler/context/flow-execution-context'
import { flowExecutor } from '../handler/flow-executor'

export const toolOperation = {
    execute: async (operation: ExecuteToolOperation): Promise<EngineResponse<ExecuteActionResponse>> => {
        const input = operation as ExecuteToolOperation
        const output = await executeActionForTool(input)
        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}

async function executeActionForTool(input: ExecuteToolOperation): Promise<ExecuteActionResponse> {
    const step: FlowAction = {
        name: input.actionName,
        displayName: input.actionName,
        type: FlowActionType.PIECE,
        settings: {
            input: input.input,
            actionName: input.actionName,
            pieceName: input.pieceName,
            pieceVersion: input.pieceVersion,
            errorHandlingOptions: {
                continueOnFailure: {
                    value: false,
                },
                retryOnFailure: {
                    value: false,
                },
            },
            propertySettings: Object.fromEntries(Object.entries(input.input).map(([key]) => [key, {
                type: PropertyExecutionType.MANUAL,
                schema: undefined,
            }])),
        },
        valid: true,
    }
    const output = await flowExecutor.getExecutorForAction(step.type).handle({
        action: step,
        executionState: FlowExecutorContext.empty(),
        constants: EngineConstants.fromExecuteActionInput(input),
    })
    return {
        success: output.verdict !== ExecutionVerdict.FAILED,
        input: output.steps[step.name].input,
        output: cleanSampleData(output.steps[step.name]),
    }
}


function cleanSampleData(stepOutput: StepOutput) {
    if (stepOutput.status === StepOutputStatus.FAILED) {
        return stepOutput.errorMessage
    }

    return stepOutput.output
}
