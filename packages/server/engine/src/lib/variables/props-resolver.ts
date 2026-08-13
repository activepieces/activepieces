import { formulaEvaluator } from '@activepieces/core-formula'
import { applyFunctionToValues, cloneResolvedValue, extractMustacheTokens, isNil, isString } from '@activepieces/core-utils'
import { ContextVersion } from '@activepieces/pieces-framework'
import { FormulaEvaluationError } from '@activepieces/shared'

import { SharedScriptSession } from '../core/code/shared-script-session'
import { FlowExecutorContext, StepView } from '../handler/context/flow-execution-context'
import { utils } from '../utils'
import { connectionToken } from './connection-token'
import { propertyPath } from './property-path'
import { scriptEvaluator } from './script-evaluator'
import { variableToken } from './variable-token'

const CONNECTIONS = 'connections'
const VARIABLES = 'variables'
const FLATTEN_NESTED_KEYS_PATTERN = /\{\{\s*flattenNestedKeys(.*?)\}\}/g
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


export const createPropsResolver = ({ engineToken, projectId, apiUrl, contextVersion, stepNames, pieceName }: PropsResolverParams) => {
    return {
        resolve: async <T = unknown>(params: ResolveInputParams): Promise<ResolveResult<T>> => {
            const { unresolvedInput, executionState } = params
            if (isNil(unresolvedInput)) {
                return {
                    resolvedInput: unresolvedInput as T,
                    censoredInput: unresolvedInput,
                }
            }
            const getStepView = createMemoizedStepViewGetter(executionState)
            const scriptSession = scriptEvaluator.initSession()
            try {
                const resolveOptions = {
                    engineToken,
                    projectId,
                    apiUrl,
                    getStepView,
                    scriptSession,
                    stepNames,
                    pieceName,
                }
                const resolvedInput = await applyFunctionToValues<T>(
                    unresolvedInput,
                    (token) => resolveInputAsync({
                        ...resolveOptions,
                        input: token,
                        censoredInput: false,
                        contextVersion,
                    }))
                const censoredInput = await applyFunctionToValues<T>(
                    unresolvedInput,
                    (token) => resolveInputAsync({
                        ...resolveOptions,
                        input: token,
                        censoredInput: true,
                        contextVersion,
                    }))
                return {
                    resolvedInput,
                    censoredInput,
                }
            }
            finally {
                await scriptSession.dispose()
            }
        },
    }
}

/**
 * input: `Hello {{firstName}} {{lastName}}`
 * tokenThatNeedResolving: [`{{firstName}}`, `{{lastName}}`]
 */
async function resolveInputAsync(params: ResolveInputInternalParams): Promise<unknown> {
    const { input, getStepView, engineToken, projectId, apiUrl, censoredInput, scriptSession, stepNames, pieceName } = params

    if (formulaEvaluator.containsWrapper(input)) {
        const formulaOptions = { engineToken, projectId, apiUrl, getStepView, censoredInput, scriptSession, stepNames, pieceName, contextVersion: params.contextVersion }
        const { expression: preResolvedExpr, vars: preResolvedVars } = await preResolveFormulaVars({ expression: input, resolveOptions: formulaOptions })
        const { result, error } = formulaEvaluator.evaluate({ expression: preResolvedExpr, sampleData: preResolvedVars })
        if (error) {
            throw new FormulaEvaluationError({ expression: input, message: error })
        }
        return result ?? ''
    }

    const tokensThatNeedResolving = extractMustacheTokens(input)
    const resolveOptions = {
        engineToken,
        projectId,
        apiUrl,
        getStepView,
        censoredInput,
        scriptSession,
        stepNames,
        pieceName,
    }
    const inputContainsOnlyOneTokenToResolve =
        tokensThatNeedResolving.length === 1 &&
        tokensThatNeedResolving[0].token === input

    if (inputContainsOnlyOneTokenToResolve) {
        const variableName = tokensThatNeedResolving[0].inner.trim()
        return resolveSingleToken({
            ...resolveOptions,
            variableName,
            contextVersion: params.contextVersion,
        })
    }
    const inputIncludesFlattenNestedKeysTokens = input.match(FLATTEN_NESTED_KEYS_PATTERN)
    if (!isNil(inputIncludesFlattenNestedKeysTokens) && tokensThatNeedResolving.length > 0) {
        return mergeFlattenedKeysArraysIntoOneArray(input, tokensThatNeedResolving.map(t => t.token), resolveOptions, params.contextVersion)
    }

    return replaceTokensAsync(input, async (_fullMatch, variableName) => {
        const result = await resolveSingleToken({
            ...resolveOptions,
            variableName: variableName.trim(),
            contextVersion: params.contextVersion,
        })
        return isString(result) ? result : JSON.stringify(result)
    })
}

async function resolveSingleToken(params: ResolveSingleTokenParams): Promise<unknown> {
    const { variableName, engineToken, projectId, apiUrl, censoredInput, contextVersion, pieceName, getStepView, scriptSession, stepNames } = params
    if (variableName.startsWith(VARIABLES)) {
        return variableToken.handle({ variableName, engineToken, projectId, apiUrl, censoredInput })
    }
    if (variableName.startsWith(CONNECTIONS)) {
        return connectionToken.handle({ variableName, engineToken, projectId, apiUrl, censoredInput, contextVersion, pieceName })
    }
    const segments = propertyPath.parse(variableName)
    if (isNil(segments) || segments.length === 0) {
        return evalWithScript({ variableName, getStepView, scriptSession, stepNames })
    }
    return evalWithPropertyPath({ segments, getStepView })
}

async function evalWithScript({ variableName, getStepView, scriptSession, stepNames }: EvalStepTokenParams): Promise<unknown> {
    const session = await scriptSession.get()
    for (const stepName of extractReferencedStepNames(variableName, stepNames)) {
        const view = await getStepView(stepName)
        if (view !== undefined) {
            await session.setGlobal(stepName, view)
        }
    }
    return scriptEvaluator.evaluate({ script: variableName, scriptSession })
}

async function evalWithPropertyPath({ segments, getStepView }: {
    segments: string[]
    getStepView: GetStepView
}): Promise<unknown> {
    const { data: result, error: resultError } = await utils.tryCatchAndThrowOnEngineError(async () => {
        const stepView = await getStepView(segments[0])
        if (isNil(stepView)) {
            return ''
        }
        const value = propertyPath.resolveValue({ segments: segments.slice(1), scope: stepView })
        return cloneResolvedValue(value) ?? ''
    })

    if (resultError) {
        console.warn('[evalWithPropertyPath] Error evaluating variable', resultError)
        return ''
    }
    return result ?? ''
}


const mergeFlattenedKeysArraysIntoOneArray = async (token: string, partsThatNeedResolving: string[],
    resolveOptions: Pick<ResolveInputInternalParams, 'engineToken' | 'projectId' | 'apiUrl' | 'getStepView' | 'censoredInput' | 'scriptSession' | 'stepNames' | 'pieceName'>,
    contextVersion: ContextVersion | undefined,
) => {
    const resolvedValues: Record<string, unknown> = {}
    let longestResultLength = 0
    for (const tokenPart of partsThatNeedResolving) {
        const variableName = tokenPart.substring(2, tokenPart.length - 2)
        resolvedValues[tokenPart] = await resolveSingleToken({
            ...resolveOptions,
            variableName,
            contextVersion,
        })
        if (Array.isArray(resolvedValues[tokenPart])) {
            longestResultLength = Math.max(longestResultLength, resolvedValues[tokenPart].length)
        }
    }
    const result = new Array(longestResultLength).fill(null).map((_, index) => {
        return Object.entries(resolvedValues).reduce((acc, [tokenPart, value]) => {
            const valueToUse = (Array.isArray(value) ? value[index] : value) ?? ''
            acc = acc.replace(tokenPart, isString(valueToUse) ? valueToUse : JSON.stringify(valueToUse))
            return acc
        }, token)
    })
    return result
}

export type PropsResolver = ReturnType<typeof createPropsResolver>

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

type PreResolveOptions = Pick<ResolveInputInternalParams, 'engineToken' | 'projectId' | 'apiUrl' | 'getStepView' | 'censoredInput' | 'contextVersion' | 'scriptSession' | 'stepNames' | 'pieceName'>

async function preResolveFormulaVars({ expression, resolveOptions }: {
    expression: string
    resolveOptions: PreResolveOptions
}): Promise<{ expression: string, vars: Record<string, unknown> }> {
    // Single-pass regex substitution with dedup: identical tokens map to the
    // same key and resolve once. The previous split/join loop created one key
    // per occurrence then replaced ALL occurrences with the first key,
    // leaving later keys orphaned in `vars`.
    const variableNameToKey = new Map<string, string>()
    const rewritten = expression.replace(/\{\{([^}]+)\}\}/g, (_, raw: string) => {
        const variableName = raw.trim()
        let key = variableNameToKey.get(variableName)
        if (key === undefined) {
            key = `__ap_pv${variableNameToKey.size}__`
            variableNameToKey.set(variableName, key)
        }
        return `{{${key}}}`
    })

    const vars: Record<string, unknown> = {}
    await Promise.all(
        Array.from(variableNameToKey.entries()).map(async ([variableName, key]) => {
            vars[key] = await resolveSingleToken({ variableName, ...resolveOptions })
        }),
    )

    return { expression: rewritten, vars }
}

type GetStepView = (stepName: string) => Promise<StepView | undefined>

type EvalStepTokenParams = {
    variableName: string
    getStepView: GetStepView
    scriptSession: SharedScriptSession
    stepNames: string[]
}

type ResolveSingleTokenParams = {
    variableName: string
    getStepView: GetStepView
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
    contextVersion: ContextVersion | undefined
    scriptSession: SharedScriptSession
    stepNames: string[]
    pieceName?: string
}

type ResolveInputInternalParams = {
    input: string
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
    getStepView: GetStepView
    contextVersion: ContextVersion | undefined
    scriptSession: SharedScriptSession
    stepNames: string[]
    pieceName?: string
}

type ResolveInputParams = {
    unresolvedInput: unknown
    executionState: FlowExecutorContext
}

type ResolveResult<T = unknown> = {
    resolvedInput: T
    censoredInput: unknown
}


type PropsResolverParams = {
    engineToken: string
    projectId: string
    apiUrl: string
    contextVersion: ContextVersion | undefined
    stepNames: string[]
    pieceName?: string
}
