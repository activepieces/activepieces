import { LoopOnItemsAction, LoopOnItemsStepOutput, StepOutput, isNil } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { EngineConstantData, ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutorNew } from './flow-executor'
import { variableService } from '../services/variable-service'


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
        constants: EngineConstantData
    }) {
        const { resolvedInput, censoredInput } = await variableService({
            projectId: constants.projectId,
            workerToken: constants.workerToken,
        }).resolve<LoopOnActionResolvedSettings>({
            unresolvedInput: action.settings,
            executionState,
        })

        let stepOutput: LoopOnItemsStepOutput = StepOutput.createLoopOutput({
            input: censoredInput,
        })

        let newExecutionContext = executionState.upsertStep(action.name, stepOutput)
        const firstLoopAction = action.firstLoopAction
        if (isNil(firstLoopAction)) {
            return newExecutionContext
        }

        for (let i = 0; i < resolvedInput.items.length; ++i) {
            const newCurrentPath = newExecutionContext.currentPath.loopIteration({ loopName: action.name, iteration: i })
            stepOutput = stepOutput.addIteration({ index: i + 1, item: resolvedInput.items[i] })

            newExecutionContext = newExecutionContext.upsertStep(action.name, stepOutput).setCurrentPath(newCurrentPath)

            newExecutionContext = await flowExecutorNew.execute({
                action: firstLoopAction,
                executionState: newExecutionContext,
                constants,
            })
            if (newExecutionContext.verdict === ExecutionVerdict.FAILED) {
                return newExecutionContext
            }

            newExecutionContext = newExecutionContext.setCurrentPath(newExecutionContext.currentPath.removeLast())
        }
        return newExecutionContext
    },
}