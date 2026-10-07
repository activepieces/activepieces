import { isNil } from '@activepieces/core-utils'
import { BaseStepOutput, FlowAction, FlowRunStatus, StepOutputStatus } from '@activepieces/shared'
import { utils } from '../utils'
import { failStep } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'

export async function executeBranches({ action, executionState, constants, stepOutput, evaluations, stopAfterFirstMatch }: ExecuteBranchesParams): Promise<FlowExecutorContext> {
    let state = await executionState.upsertStep(action.name, stepOutput)

    const { data: executionStateResult, error: executionStateError } = await utils.tryCatchAndThrowOnEngineError(async () => {
        for (let i = 0; i < evaluations.length; i++) {
            if (!isNil(constants.stepNameToTest)) {
                break
            }
            if (!evaluations[i]) {
                continue
            }

            state = await flowExecutor.execute({
                action: action.children[i],
                executionState: state,
                constants,
            })

            const shouldBreakExecution = state.verdict.status !== FlowRunStatus.RUNNING || stopAfterFirstMatch
            if (shouldBreakExecution) {
                break
            }
        }
        return state
    })
    if (executionStateError) {
        return failStep({
            action,
            executionState: state,
            stepOutput: stepOutput.setStatus(StepOutputStatus.FAILED),
            error: executionStateError,
        })
    }

    return executionStateResult
}

export type BranchedStep = Pick<FlowAction, 'name' | 'displayName'> & {
    children: (FlowAction | null)[]
}

type ExecuteBranchesParams = {
    action: BranchedStep
    executionState: FlowExecutorContext
    constants: EngineConstants
    stepOutput: BaseStepOutput
    evaluations: boolean[]
    stopAfterFirstMatch: boolean
}
