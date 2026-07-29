import { isNil } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { FlowRunStatus, LoopOnItemsAction, LoopStepOutput } from '@activepieces/shared'
import { branchClient } from '../piece-context/branch-client'
import { utils } from '../utils'
import { BaseExecutor, failStep } from './base-executor'
import { EngineConstants } from './context/engine-constants'
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
        const { data: resolved, error: resolveError } = await utils.tryCatchAndThrowOnEngineError(() =>
            constants.getPropsResolver(LATEST_CONTEXT_VERSION).resolve<LoopOnActionResolvedSettings>({
                unresolvedInput: {
                    items: action.settings.items,
                },
                executionState,
            }),
        )
        if (resolveError) {
            return failStep({
                action,
                executionState,
                stepOutput: LoopStepOutput.init({ input: {} }),
                error: resolveError,
                durationMs: performance.now() - stepStartTime,
            })
        }
        const { resolvedInput, censoredInput } = resolved
        const previousStepOutput = executionState.getLoopStepOutput({ stepName: action.name })
        let stepOutput = previousStepOutput ?? LoopStepOutput.init({
            input: censoredInput,
        })
        let newExecutionContext = await executionState.upsertStep(action.name, stepOutput)

        if (!Array.isArray(resolvedInput.items)) {
            return failStep({
                action,
                executionState: newExecutionContext,
                stepOutput,
                error: JSON.stringify({ message: 'The items you have selected must be a list.' }),
                durationMs: performance.now() - stepStartTime,
            })
        }

        const firstLoopAction = action.firstLoopAction
        const testSingleStepMode = !isNil(constants.stepNameToTest)
        const concurrency = action.settings.concurrency ?? 1

        if (shouldFanOut({ action, constants, concurrency, itemCount: resolvedInput.items.length, testSingleStepMode })) {
            const { error: fanOutError } = await utils.tryCatchAndThrowOnEngineError(() => branchClient.fanOut({
                apiUrl: constants.internalApiUrl,
                engineToken: constants.engineToken,
                flowRunId: constants.flowRunId,
                stepName: action.name,
                itemCount: resolvedInput.items.length,
                concurrency,
            }))
            if (fanOutError) {
                return failStep({
                    action,
                    executionState: newExecutionContext,
                    stepOutput,
                    error: fanOutError,
                    durationMs: performance.now() - stepStartTime,
                })
            }
            return (await newExecutionContext.upsertStep(action.name, stepOutput.setDuration(performance.now() - stepStartTime)))
                .setVerdict({ status: FlowRunStatus.PAUSED })
        }

        const iterations = isNil(constants.branch) || constants.branch.stepName !== action.name
            ? resolvedInput.items.map((_, index) => index)
            : [constants.branch.index]

        for (const i of iterations) {
            const newCurrentPath = newExecutionContext.currentPath.loopIteration({ loopName: action.name, iteration: i })

            stepOutput = stepOutput.setItemAndIndex({ item: resolvedInput.items[i], index: i + 1 })
            // ponytail: pad rather than append — a branch run starts at its own index,
            // so a single addIteration() would land iteration 500 at position 0.
            while (!stepOutput.hasIteration(i)) {
                stepOutput = stepOutput.addIteration()
            }
            newExecutionContext = (await newExecutionContext.upsertStep(action.name, stepOutput)).setCurrentPath(newCurrentPath)
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

function shouldFanOut({ action, constants, concurrency, itemCount, testSingleStepMode }: ShouldFanOutParams): boolean {
    const alreadyABranch = constants.branch?.stepName === action.name
    return concurrency > 1 && itemCount > 0 && !testSingleStepMode && !alreadyABranch && !isNil(action.firstLoopAction)
}

type ShouldFanOutParams = {
    action: LoopOnItemsAction
    constants: EngineConstants
    concurrency: number
    itemCount: number
    testSingleStepMode: boolean
}
