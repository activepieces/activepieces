import { isNil, LoopOnItemsAction, LoopStepOutput, StepOutputStatus } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { ExecutionVerdict } from './context/flow-execution-context'
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
        const { resolvedInput, censoredInput } = await constants.propsResolver.resolve<LoopOnActionResolvedSettings>({
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
            const failedStepOutput = stepOutput
                .setStatus(StepOutputStatus.FAILED)
                .setErrorMessage(JSON.stringify({
                    message: 'The items you have selected must be a list.',
                }))
            return newExecutionContext.upsertStep(action.name, failedStepOutput).setVerdict(ExecutionVerdict.FAILED)
        }

        const firstLoopAction = action.firstLoopAction


        for (let i = 0; i < resolvedInput.items.length; ++i) {
            const newCurrentPath = newExecutionContext.currentPath.loopIteration({ loopName: action.name, iteration: i })

            stepOutput = stepOutput.setItemAndIndex({ item: resolvedInput.items[i], index: i + 1 })
            const addEmptyIteration = !stepOutput.hasIteration(i)
            if (addEmptyIteration) {
                stepOutput = stepOutput.addIteration()
                newExecutionContext = newExecutionContext.upsertStep(action.name, stepOutput)
            }
            newExecutionContext = newExecutionContext.setCurrentPath(newCurrentPath)
            if (!isNil(firstLoopAction) && !constants.testSingleStepMode) {
                newExecutionContext = await flowExecutor.execute({
                    action: firstLoopAction,
                    executionState: newExecutionContext,
                    constants,
                })
            }

            newExecutionContext = newExecutionContext.setCurrentPath(newExecutionContext.currentPath.removeLast())

            if (newExecutionContext.verdict !== ExecutionVerdict.RUNNING) {
                return newExecutionContext
            }

            if (constants.testSingleStepMode) {
                break
            }
        }
        return newExecutionContext
    },
}
