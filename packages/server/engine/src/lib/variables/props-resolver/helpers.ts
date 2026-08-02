import { extractMustacheTokens, isNil, isString } from '@activepieces/core-utils'
import { FlowExecutorContext, StepView } from '../../handler/context/flow-execution-context'
import { GetStepView } from './types'

async function replaceTokensAsync(
    str: string,
    replacer: (token: string, inner: string) => Promise<string>,
): Promise<string> {
    const tokens = extractMustacheTokens(str)
    let result = ''
    let lastIndex = 0
    for (const { token, inner, index } of tokens) {
        result += str.slice(lastIndex, index)
        result += await replacer(token, inner)
        lastIndex = index + token.length
    }
    result += str.slice(lastIndex)
    return result
}

function extractReferencedStepNames(input: unknown, stepNames: string[]): Set<string> {
    const referencedSteps = new Set<string>()
    const stack: unknown[] = [input]
    while (stack.length > 0 && referencedSteps.size < stepNames.length) {
        const current = stack.pop()
        if (isString(current)) {
            for (const stepName of stepNames) {
                if (current.includes(stepName)) {
                    referencedSteps.add(stepName)
                }
            }
        }
        else if (Array.isArray(current)) {
            stack.push(...current)
        }
        else if (typeof current === 'object' && current !== null) {
            stack.push(...Object.keys(current), ...Object.values(current))
        }
    }
    return referencedSteps
}

function createMemoizedStepViewGetter(executionState: FlowExecutorContext): GetStepView {
    const stepViewCache = new Map<string, Promise<StepView | undefined>>()
    return (stepName: string) => {
        let view = stepViewCache.get(stepName)
        if (isNil(view)) {
            view = executionState.getStepView(stepName)
            stepViewCache.set(stepName, view)
        }
        return view
    }
}

function cloneResolvedValue(value: unknown): unknown {
    switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
            return value
        case 'object': {
            if (value === null) {
                return null
            }
            const serialized = JSON.stringify(value)
            return isNil(serialized) ? undefined : JSON.parse(serialized)
        }
        default:
            return undefined
    }
}

function flattenNestedKeys(data: unknown, pathToMatch: string[]): unknown[] {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        for (const [key, value] of Object.entries(data)) {
            if (key === pathToMatch[0]) {
                return flattenNestedKeys(value, pathToMatch.slice(1))
            }
        }
    }
    else if (Array.isArray(data)) {
        return data.flatMap((d) => flattenNestedKeys(d, pathToMatch))
    }
    else if (pathToMatch.length === 0) {
        return [data]
    }
    return []
}

export const propsResolverUtils = {
    replaceTokensAsync,
    extractReferencedStepNames,
    createMemoizedStepViewGetter,
    cloneResolvedValue,
    flattenNestedKeys,
}
