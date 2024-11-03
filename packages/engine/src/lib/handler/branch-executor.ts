import {  BranchAction, BranchActionSettings, BranchStepOutput, StepOutputStatus } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { ExecutionVerdict } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'
import { evaluateConditions } from './router-executor'

export const branchExecutor: BaseExecutor<BranchAction> = {
    async handle({
        action,
        executionState,
        constants,
    }) {
        const { censoredInput, resolvedInput } = await constants.variableService.resolve<BranchActionSettings>({
            unresolvedInput: action.settings,
            executionState,
        })

        const evaluatedCondition = evaluateConditions(resolvedInput.conditions)
        const stepOutput = BranchStepOutput.init({
            input: censoredInput,
        }).setOutput({
            condition: evaluatedCondition,
        })

        try {
            let branchExecutionContext = executionState.upsertStep(action.name, stepOutput)

            if (!evaluatedCondition && action.onFailureAction) {
                branchExecutionContext = await flowExecutor.execute({
                    action: action.onFailureAction,
                    executionState: branchExecutionContext,
                    constants,
                })
            }
            if (evaluatedCondition && action.onSuccessAction) {
                branchExecutionContext = (await flowExecutor.execute({
                    action: action.onSuccessAction,
                    executionState: branchExecutionContext,
                    constants,
                }))
            }

            return branchExecutionContext
        }
        catch (e) {
            console.error(e)
            const failedStepOutput = stepOutput.setErrorMessage((e as Error).message).setStatus(StepOutputStatus.FAILED)
            return executionState.upsertStep(action.name, failedStepOutput).setVerdict(ExecutionVerdict.FAILED, undefined)
        }
    },
}

