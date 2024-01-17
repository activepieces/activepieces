import { CodeAction, PieceAction } from '@activepieces/shared'
import { ExecutionVerdict, FlowExecutorContext } from '../handler/context/flow-execution-context'
import { EngineConstants } from '../handler/context/engine-constants'

export async function runWithExponentialBackoff<T extends CodeAction | PieceAction>(
    executionState: FlowExecutorContext,
    action: T,
    constants: EngineConstants,
    requestFunction: (request: { action: T, executionState: FlowExecutorContext, constants: EngineConstants }) => Promise<FlowExecutorContext>,
    attemptCount = 1,
): Promise<FlowExecutorContext> {
    const resultExecutionState = await requestFunction({ action, executionState, constants })
    const retryEnabled = action.settings.errorHandlingOptions?.retryOnFailure?.value

    if (resultExecutionState.verdict === ExecutionVerdict.FAILED && attemptCount < constants.retryConstants.maxAttempts && retryEnabled && !constants.testSingleStepMode) {
        const backoffTime = Math.pow(constants.retryConstants.retryExponential, attemptCount) * constants.retryConstants.retryInterval
        await new Promise(resolve => setTimeout(resolve, backoffTime))
        return runWithExponentialBackoff(executionState, action, constants, requestFunction, attemptCount + 1)
    }
    return resultExecutionState
}

export async function continueIfFailureHandler<T extends CodeAction | PieceAction>(
    executionState: FlowExecutorContext,
    action: T,
    constants: EngineConstants,
): Promise<FlowExecutorContext> {
    const continueOnFailure = action.settings.errorHandlingOptions?.continueOnFailure?.value

    if (executionState.verdict === ExecutionVerdict.FAILED && continueOnFailure && !constants.testSingleStepMode) {
        return executionState.setVerdict(ExecutionVerdict.RUNNING, undefined).increaseTask()
    }
    return executionState
}