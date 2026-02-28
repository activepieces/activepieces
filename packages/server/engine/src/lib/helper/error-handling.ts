import { CodeAction, FlowGraphNode, FlowRunStatus, isNil, PieceAction } from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import {  FlowExecutorContext } from '../handler/context/flow-execution-context'

export async function runWithExponentialBackoff(
    executionState: FlowExecutorContext,
    node: FlowGraphNode,
    constants: EngineConstants,
    requestFunction: RequestFunction,
    attemptCount = 1,
): Promise<FlowExecutorContext> {
    const resultExecutionState = await requestFunction({ node, executionState, constants })
    const action = node.data as CodeAction | PieceAction
    const retryEnabled = action.settings.errorHandlingOptions?.retryOnFailure?.value
    if (
        executionFailedWithRetryableError(resultExecutionState) &&
        attemptCount < constants.retryConstants.maxAttempts &&
        retryEnabled &&
        isNil(constants.stepNameToTest)
    ) {
        const backoffTime = Math.pow(constants.retryConstants.retryExponential, attemptCount) * constants.retryConstants.retryInterval
        await new Promise(resolve => setTimeout(resolve, backoffTime))
        return runWithExponentialBackoff(executionState, node, constants, requestFunction, attemptCount + 1)
    }

    return resultExecutionState
}

export async function continueIfFailureHandler(
    executionState: FlowExecutorContext,
    node: FlowGraphNode,
    constants: EngineConstants,
): Promise<FlowExecutorContext> {
    const action = node.data as CodeAction | PieceAction
    const continueOnFailure = action.settings.errorHandlingOptions?.continueOnFailure?.value

    if (
        executionState.verdict.status === FlowRunStatus.FAILED &&
        continueOnFailure &&
        isNil(constants.stepNameToTest)
    ) {
        return executionState
            .setVerdict({ status: FlowRunStatus.RUNNING })
    }

    return executionState
}


const executionFailedWithRetryableError = (flowExecutorContext: FlowExecutorContext): boolean => {
    return flowExecutorContext.verdict.status === FlowRunStatus.FAILED
}

type Request = {
    node: FlowGraphNode
    executionState: FlowExecutorContext
    constants: EngineConstants
}

type RequestFunction = (request: Request) => Promise<FlowExecutorContext>
