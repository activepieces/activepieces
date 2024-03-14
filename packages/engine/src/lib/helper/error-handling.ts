import { CodeAction, PieceAction } from '@activepieces/shared'
import { ExecutionVerdict, FlowExecutorContext } from '../handler/context/flow-execution-context'
import { EngineConstants } from '../handler/context/engine-constants'
import { RetryableError } from './execution-errors'

export async function runWithExponentialBackoff<T extends CodeAction | PieceAction>(
    executionState: FlowExecutorContext,
    action: T,
    constants: EngineConstants,
    requestFunction: RequestFunction<T>,
    attemptCount = 1,
): Promise<FlowExecutorContext> {
    const resultExecutionState = await requestFunction({ action, executionState, constants })
    const retryEnabled = action.settings.errorHandlingOptions?.retryOnFailure?.value

    if (
        executionFailedWithRetryableError(resultExecutionState) &&
        attemptCount < constants.retryConstants.maxAttempts &&
        retryEnabled &&
        !constants.testSingleStepMode
    ) {
        const backoffTime = Math.pow(constants.retryConstants.retryExponential, attemptCount) * constants.retryConstants.retryInterval
        await new Promise(resolve => setTimeout(resolve, backoffTime))
        return runWithExponentialBackoff(executionState, action, constants, requestFunction, attemptCount + 1)
    }

    return resultExecutionState
}

export async function continueIfFailureHandler(
    executionState: FlowExecutorContext,
    action: CodeAction | PieceAction,
    constants: EngineConstants,
): Promise<FlowExecutorContext> {
    const continueOnFailure = action.settings.errorHandlingOptions?.continueOnFailure?.value

    if (
        executionState.verdict === ExecutionVerdict.FAILED &&
        continueOnFailure &&
        !constants.testSingleStepMode
    ) {
        return executionState
            .setVerdict(ExecutionVerdict.RUNNING, undefined)
            .increaseTask()
    }

    return executionState
}

export const handleExecutionError = (error: unknown): ErrorHandlingResponse => {
    logError(error)

    return {
        message: error instanceof Error ? error.message : JSON.stringify(error),
        retryable: error instanceof RetryableError,
    }
}

const logError = (error: unknown): void => {
    const serializedError = JSON.stringify(error, Object.getOwnPropertyNames(error))
    console.error(serializedError)
}

const executionFailedWithRetryableError = (flowExecutorContext: FlowExecutorContext): boolean => {
    return flowExecutorContext.verdict === ExecutionVerdict.FAILED &&
        [true, undefined].includes(flowExecutorContext.retryable)
}

type Request<T extends CodeAction | PieceAction> = {
    action: T
    executionState: FlowExecutorContext
    constants: EngineConstants
}

type RequestFunction<T extends CodeAction | PieceAction> = (request: Request<T>) => Promise<FlowExecutorContext>

type ErrorHandlingResponse = {
    message: string
    retryable: boolean
}
