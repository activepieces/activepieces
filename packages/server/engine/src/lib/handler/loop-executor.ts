import { isNil } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { escapeSensitivePathSegment, FlowRunStatus, LoopOnItemsAction, LoopStepOutput, SENSITIVE_VALUE_REDACTED } from '@activepieces/shared'
import { utils } from '../utils'
import { BaseExecutor, failStep } from './base-executor'
import { flowExecutor } from './flow-executor'

export const loopExecutor: BaseExecutor<LoopOnItemsAction> = {
    async handle({
        action,
        executionState,
        constants,
    }) {
        const stepStartTime = performance.now()
        const { data: resolved, error: resolveError } = await utils.tryCatchAndThrowOnEngineError(() =>
            constants.getPropsResolver({ contextVersion: LATEST_CONTEXT_VERSION }).resolve<LoopOnActionResolvedSettings>({
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

        const itemSensitivePaths = collectItemSensitivePaths(censoredInput)
        if (itemSensitivePaths.length > 0) {
            stepOutput = new LoopStepOutput({ ...stepOutput, sensitiveOutputPaths: itemSensitivePaths })
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
            newExecutionContext = (await newExecutionContext.upsertStep(action.name, stepOutput)).setCurrentPath(newCurrentPath)
            if (!isNil(firstLoopAction) && !testSingleStepMode) {
                newExecutionContext = await flowExecutor.execute({
                    action: firstLoopAction,
                    executionState: newExecutionContext,
                    constants,
                })
            }

            newExecutionContext = newExecutionContext.setCurrentPath(newExecutionContext.currentPath.removeLast())
            stepOutput = newExecutionContext.getLoopStepOutput({ stepName: action.name }) ?? stepOutput

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

function collectItemSensitivePaths(censoredInput: unknown): string[] {
    if (isNil(censoredInput) || typeof censoredInput !== 'object' || !('items' in censoredInput)) {
        return []
    }
    const censoredItems = censoredInput.items
    if (!Array.isArray(censoredItems)) {
        return censoredItems === SENSITIVE_VALUE_REDACTED ? ['item'] : []
    }
    const paths = new Set<string>()
    for (const item of censoredItems) {
        collectSentinelPaths({ value: item, prefix: 'item', paths })
    }
    return Array.from(paths)
}

function collectSentinelPaths({ value, prefix, paths }: { value: unknown, prefix: string, paths: Set<string> }): void {
    if (value === SENSITIVE_VALUE_REDACTED) {
        paths.add(prefix)
        return
    }
    if (Array.isArray(value)) {
        value.forEach((entry, index) => collectSentinelPaths({ value: entry, prefix: `${prefix}.${index}`, paths }))
        return
    }
    if (!isNil(value) && typeof value === 'object') {
        for (const [key, entry] of Object.entries(value)) {
            collectSentinelPaths({ value: entry, prefix: `${prefix}.${escapeSensitivePathSegment(key)}`, paths })
        }
    }
}

type LoopOnActionResolvedSettings = {
    items: readonly unknown[]
}
