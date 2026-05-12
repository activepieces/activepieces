import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { chunk, FlowRunStatus, isNil, LOOP_DEFAULT_CONCURRENCY, LOOP_MAX_CONCURRENCY, LOOP_MIN_CONCURRENCY, LoopOnItemsAction, LoopStepOutput, StepOutputStatus } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'

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
                .setDuration(performance.now() - stepStartTime)
            return newExecutionContext.upsertStep(action.name, failedStepOutput).setVerdict({ status: FlowRunStatus.FAILED, failedStep: {
                name: action.name,
                displayName: action.displayName,
                message: errorMessage,
            } })
        }

        const firstLoopAction = action.firstLoopAction
        const testSingleStepMode = !isNil(constants.stepNameToTest)
        const items = resolvedInput.items

        if (action.settings.executeAsync === true && !testSingleStepMode) {
            const finalContext = await runIterationsInParallel({
                action,
                items,
                firstLoopAction,
                executionContext: newExecutionContext,
                stepOutput,
                constants,
            })
            return finalContext.upsertStep(action.name, stepOutput.setDuration(performance.now() - stepStartTime))
        }

        for (let i = 0; i < items.length; ++i) {
            const newCurrentPath = newExecutionContext.currentPath.loopIteration({ loopName: action.name, iteration: i })

            stepOutput = stepOutput.setItemAndIndex({ item: items[i], index: i + 1 })
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

async function runIterationsInParallel({
    action,
    items,
    firstLoopAction,
    executionContext,
    stepOutput,
    constants,
}: RunIterationsInParallelParams): Promise<FlowExecutorContext> {
    const concurrency = clampConcurrency(action.settings.concurrency)
    const basePath = executionContext.currentPath

    let preparedStepOutput = stepOutput
    for (let i = 0; i < items.length; i++) {
        preparedStepOutput = preparedStepOutput.setItemAndIndex({ item: items[i], index: i + 1 })
        if (!preparedStepOutput.hasIteration(i)) {
            preparedStepOutput = preparedStepOutput.addIteration()
        }
    }
    let context = executionContext.upsertStep(action.name, preparedStepOutput)

    if (isNil(firstLoopAction)) {
        return context
    }

    const indices = items.map((_, i) => i)
    const batches = chunk(indices, concurrency)

    for (const batch of batches) {
        const baseline = context.stepsCount
        const batchResults = await Promise.all(batch.map(async (i) => {
            const iterationPath = basePath.loopIteration({ loopName: action.name, iteration: i })
            const fork = context.setCurrentPath(iterationPath)
            return flowExecutor.execute({
                action: firstLoopAction,
                executionState: fork,
                constants,
            })
        }))

        const batchDelta = batchResults.reduce((sum, result) => sum + (result.stepsCount - baseline), 0)
        context = applyStepsExecutedDelta(context, batchDelta)

        const terminal = batchResults.find((result) => result.verdict.status !== FlowRunStatus.RUNNING)
        if (terminal) {
            return context.setVerdict(terminal.verdict).setCurrentPath(basePath)
        }
    }

    return context.setCurrentPath(basePath)
}

function clampConcurrency(concurrency: number | undefined): number {
    if (isNil(concurrency)) {
        return LOOP_DEFAULT_CONCURRENCY
    }
    return Math.min(Math.max(concurrency, LOOP_MIN_CONCURRENCY), LOOP_MAX_CONCURRENCY)
}

function applyStepsExecutedDelta(context: FlowExecutorContext, delta: number): FlowExecutorContext {
    let result = context
    for (let i = 0; i < delta; i++) {
        result = result.incrementStepsExecuted()
    }
    return result
}

type LoopOnActionResolvedSettings = {
    items: readonly unknown[]
}

type RunIterationsInParallelParams = {
    action: LoopOnItemsAction
    items: readonly unknown[]
    firstLoopAction: LoopOnItemsAction['firstLoopAction']
    executionContext: FlowExecutorContext
    stepOutput: LoopStepOutput
    constants: EngineConstants
}
