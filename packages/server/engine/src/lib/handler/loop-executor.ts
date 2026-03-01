import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { FlowRunStatus, flowStructureUtil, isNil, LoopOnItemsAction, LoopStepOutput, StepOutputStatus } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { flowExecutor } from './flow-executor'

type LoopOnActionResolvedSettings = {
    items: readonly unknown[]
}

export const loopExecutor: BaseExecutor = {
    async handle({
        node,
        executionState,
        constants,
    }) {
        const action = node.data as LoopOnItemsAction
        const stepName = node.id
        const stepStartTime = performance.now()
        const { resolvedInput, censoredInput } = await constants.getPropsResolver(LATEST_CONTEXT_VERSION).resolve<LoopOnActionResolvedSettings>({
            unresolvedInput: {
                items: action.settings.items,
            },
            executionState,
        })
        const previousStepOutput = executionState.getLoopStepOutput({ stepName })
        let stepOutput = previousStepOutput ?? LoopStepOutput.init({
            input: censoredInput,
        })
        let newExecutionContext = executionState.upsertStep(stepName, stepOutput)

        if (!Array.isArray(resolvedInput.items)) {
            const errorMessage = JSON.stringify({
                message: 'The items you have selected must be a list.',
            })
            const failedStepOutput = stepOutput
                .setStatus(StepOutputStatus.FAILED)
                .setErrorMessage(errorMessage)
                .setDuration( performance.now() - stepStartTime)
            return newExecutionContext.upsertStep(stepName, failedStepOutput).setVerdict({ status: FlowRunStatus.FAILED, failedStep: {
                name: stepName,
                displayName: action.displayName,
                message: errorMessage,
            } })
        }

        const graph = constants.flowVersion!.graph
        const loopEdge = flowStructureUtil.getLoopEdge(graph, stepName)
        const childStepNames = loopEdge?.target
            ? flowStructureUtil.getDefaultChain(graph, loopEdge.target)
            : []

        for (let i = 0; i < resolvedInput.items.length; ++i) {
            const newCurrentPath = newExecutionContext.currentPath.loopIteration({ loopName: stepName, iteration: i })

            const testSingleStepMode = !isNil(constants.stepNameToTest)
            stepOutput = stepOutput.setItemAndIndex({ item: resolvedInput.items[i], index: i + 1 })
            const addEmptyIteration = !stepOutput.hasIteration(i)
            if (addEmptyIteration) {
                stepOutput = stepOutput.addIteration()
            }
            newExecutionContext = newExecutionContext.upsertStep(stepName, stepOutput).setCurrentPath(newCurrentPath)
            if (childStepNames.length > 0 && !testSingleStepMode) {
                newExecutionContext = await flowExecutor.execute({
                    stepNames: childStepNames,
                    executionState: newExecutionContext,
                    constants,
                })
            }

            newExecutionContext = newExecutionContext.setCurrentPath(newExecutionContext.currentPath.removeLast())

            if (newExecutionContext.verdict.status !== FlowRunStatus.RUNNING) {
                return newExecutionContext.upsertStep(stepName, stepOutput.setDuration(performance.now() - stepStartTime))
            }

            if (testSingleStepMode) {
                break
            }
        }
        return newExecutionContext.upsertStep(stepName, stepOutput.setDuration(performance.now() - stepStartTime))
    },
}
