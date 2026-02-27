import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { FlowRunStatus, isNil, LoopOnItemsAction, LoopStepOutput, StepOutputStatus } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { flowExecutor } from './flow-executor'

type LoopOnActionResolvedSettings = {
    items: readonly unknown[]
}

export const loopExecutor: BaseExecutor<LoopOnItemsAction> = {
    async handle({
        action,
        executionState,
        constants,
    }) {
        const stepStartTime = performance.now()
        const { resolvedInput, censoredInput } = await constants.getPropsResolver(LATEST_CONTEXT_VERSION).resolve<LoopOnActionResolvedSettings>({
            unresolvedInput: {
                items: action.settings.items,
            },
            executionState,
        })
        const previousStepOutput = executionState.getLoopStepOutput({ stepName: action.name })
        let stepOutput = previousStepOutput ?? LoopStepOutput.init({
            input: censoredInput,
        })
        let newExecutionContext = executionState.upsertStep(action.name, stepOutput)

        if (!Array.isArray(resolvedInput.items)) {
            const errorMessage = JSON.stringify({
                message: 'The items you have selected must be a list.',
            })
            const failedStepOutput = stepOutput
                .setStatus(StepOutputStatus.FAILED)
                .setErrorMessage(errorMessage)
                .setDuration( performance.now() - stepStartTime)
            return newExecutionContext.upsertStep(action.name, failedStepOutput).setVerdict({ status: FlowRunStatus.FAILED, failedStep: {
                name: action.name,
                displayName: action.displayName,
                message: errorMessage,
            } })
        }

        const firstLoopAction = action.firstLoopAction


        for (let i = 0; i < resolvedInput.items.length; ++i) {
            const newCurrentPath = newExecutionContext.currentPath.loopIteration({ loopName: action.name, iteration: i })

            const testSingleStepMode = !isNil(constants.stepNameToTest)
            stepOutput = stepOutput.setItemAndIndex({ item: resolvedInput.items[i], index: i + 1 })
            const addEmptyIteration = !stepOutput.hasIteration(i)
            if (addEmptyIteration) {
                stepOutput = stepOutput.addIteration()
            }
            newExecutionContext = newExecutionContext.upsertStep(action.name, stepOutput).setCurrentPath(newCurrentPath)
            if (!isNil(firstLoopAction) && !testSingleStepMode) {
                newExecutionContext = await flowExecutor.execute({
                    action: firstLoopAction,
                    executionState: newExecutionContext,
                    constants,
                })
            }

            newExecutionContext = newExecutionContext.setCurrentPath(newExecutionContext.currentPath.removeLast())

            if (newExecutionContext.verdict.status !== FlowRunStatus.RUNNING) {
                return newExecutionContext.upsertStep(action.name, stepOutput.setDuration(performance.now() - stepStartTime))
            }

            if (testSingleStepMode) {
                break
            }
        }
        return newExecutionContext.upsertStep(action.name, stepOutput.setDuration(performance.now() - stepStartTime))
    },
}
