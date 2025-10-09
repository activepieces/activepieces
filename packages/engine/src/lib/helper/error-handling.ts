import { ActivepiecesError, CodeAction, FlowRunStatus, GenericStepOutput, PieceAction, StepOutputStatus } from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { ExecutionVerdict, FlowExecutorContext, VerdictResponse } from '../handler/context/flow-execution-context'
import { ExecutionError, ExecutionErrorType } from './execution-errors'

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

const parseJsonInErrorMessage = (errorMessage: string | undefined): unknown => {
    if (!errorMessage) {
        return undefined;
    }
    try {
        return JSON.parse(errorMessage);
    } catch (error) {
        return errorMessage;
    }   
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
        const errorMessage = executionState.error?.message;
        if (errorMessage) {
            const newStepOutput = GenericStepOutput.create({
                input: action.settings.input,
                type: action.type,
                status: StepOutputStatus.FAILED,
            });
            const errorJson = parseJsonInErrorMessage(errorMessage);
            newStepOutput.output = errorJson;
            return executionState.upsertStep(action.name, newStepOutput).setVerdict(ExecutionVerdict.RUNNING, undefined).increaseTask()
        }
        return executionState
            .setVerdict(ExecutionVerdict.RUNNING, undefined)
            .increaseTask()
    }

    return executionState
}

export const handleExecutionError = (error: unknown): ErrorHandlingResponse => {
    const isEngineError = (error instanceof ExecutionError) && error.type === ExecutionErrorType.ENGINE
    const isActivepiecesError = error instanceof ActivepiecesError
    const errorMessage = isActivepiecesError ? JSON.stringify(error?.error?.params, null, 2) : JSON.stringify(error, null, 2)
    return {
        message: error instanceof Error ? error.message : errorMessage,
        verdictResponse: isEngineError ? {
            reason: FlowRunStatus.INTERNAL_ERROR,
        } : undefined,
    }
}

const executionFailedWithRetryableError = (flowExecutorContext: FlowExecutorContext): boolean => {
    return flowExecutorContext.verdict === ExecutionVerdict.FAILED
}

type Request<T extends CodeAction | PieceAction> = {
    action: T
    executionState: FlowExecutorContext
    constants: EngineConstants
}

type RequestFunction<T extends CodeAction | PieceAction> = (request: Request<T>) => Promise<FlowExecutorContext>

type ErrorHandlingResponse = {
    message: string
    verdictResponse: VerdictResponse | undefined
}
