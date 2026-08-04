import { isNil, isString } from '@activepieces/core-utils'
import { BaseStepOutput, FlowAction, FlowRunStatus, StepOutputStatus } from '@activepieces/shared'
import { utils } from '../utils'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'

export async function failStep({ action, executionState, stepOutput, error, durationMs }: FailStepParams): Promise<FlowExecutorContext> {
    const message = isString(error) ? error : utils.formatError(error)
    const failed = stepOutput.setStatus(StepOutputStatus.FAILED).setErrorMessage(message)
    const withDuration = isNil(durationMs) ? failed : failed.setDuration(durationMs)
    return (await executionState.upsertStep(action.name, withDuration)).setVerdict({
        status: FlowRunStatus.FAILED,
        failedStep: {
            name: action.name,
            displayName: action.displayName,
            message,
        },
    })
}

export type ActionHandler<T extends FlowAction> = (request: { action: T, executionState: FlowExecutorContext, constants: EngineConstants }) => Promise<FlowExecutorContext>

export type BaseExecutor<T extends FlowAction> = {
    handle(request: {
        action: T
        executionState: FlowExecutorContext
        constants: EngineConstants
    }): Promise<FlowExecutorContext>
}

type FailStepParams = {
    action: Pick<FlowAction, 'name' | 'displayName'>
    executionState: FlowExecutorContext
    stepOutput: BaseStepOutput
    error: Error | string
    durationMs?: number
}
