import { LoopOnItemsAction, LoopStepOutput, isNil } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'
import { EngineConstants } from './context/engine-constants'

type LoopOnActionResolvedSettings = {
    items: readonly unknown[]
}

export const loopExecutor: BaseExecutor<LoopOnItemsAction> = {
    async handle({
        action,
        executionState,
        constants,
    }: {
        action: LoopOnItemsAction
        executionState: FlowExecutorContext
        constants: EngineConstants
    }) {
        const { resolvedInput, censoredInput } = await constants.variableService.resolve<LoopOnActionResolvedSettings>({
            unresolvedInput: {
                items: action.settings.items,
            },
            executionState,
        })

        let stepOutput = LoopStepOutput.init({
            input: censoredInput,
        })

        let newExecutionContext = executionState.upsertStep(action.name, stepOutput)
        const firstLoopAction = action.firstLoopAction


        for (let i = 0; i < resolvedInput.items.length; ++i) {
            const newCurrentPath = newExecutionContext.currentPath.loopIteration({ loopName: action.name, iteration: i })
            stepOutput = stepOutput.addIteration({ index: i + 1, item: resolvedInput.items[i] })

            newExecutionContext = newExecutionContext.upsertStep(action.name, stepOutput).setCurrentPath(newCurrentPath)
            if (!isNil(firstLoopAction) && !constants.testSingleStepMode) {
                newExecutionContext = await flowExecutor.execute({
                    action: firstLoopAction,
                    executionState: newExecutionContext,
                    constants,
                })
            }

            if (newExecutionContext.verdict !== ExecutionVerdict.RUNNING) {
                return newExecutionContext
            }

            newExecutionContext = newExecutionContext.setCurrentPath(newExecutionContext.currentPath.removeLast())
            if (constants.testSingleStepMode) {
                break
            }
        }
        return newExecutionContext
    },
}
