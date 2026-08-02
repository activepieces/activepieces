import { formulaEvaluator } from '@activepieces/core-formula'
import { applyFunctionToValues, extractMustacheTokens, isNil, isString } from '@activepieces/core-utils'
import { ContextVersion } from '@activepieces/pieces-framework'
import { FormulaEvaluationError } from '@activepieces/shared'
import { FlowExecutorContext } from '../../handler/context/flow-execution-context'
import { propsResolverUtils } from './helpers'
import { buildScriptContext, createSharedScriptSession } from './script-session'
import { resolveSingleToken } from './token-resolver'
import { GetStepView, SharedScriptSession } from './types'

const FLATTEN_NESTED_KEYS_PATTERN = /\{\{\s*flattenNestedKeys(.*?)\}\}/g

export const createPropsResolver = ({ engineToken, projectId, apiUrl, contextVersion, stepNames }: PropsResolverParams) => {
    return {
        resolve: async <T = unknown>(params: ResolveInputParams): Promise<ResolveResult<T>> => {
            const { unresolvedInput, executionState } = params
            if (isNil(unresolvedInput)) {
                return {
                    resolvedInput: unresolvedInput as T,
                    censoredInput: unresolvedInput,
                }
            }
            const referencedStepNames = propsResolverUtils.extractReferencedStepNames(unresolvedInput, stepNames)
            const getStepView = propsResolverUtils.createMemoizedStepViewGetter(executionState)
            const scriptSession = createSharedScriptSession(async () => ({
                scriptContext: await buildScriptContext({ referencedStepNames, getStepView }),
                functions: { flattenNestedKeys: propsResolverUtils.flattenNestedKeys },
            }))
            try {
                const resolveOptions = {
                    engineToken,
                    projectId,
                    apiUrl,
                    getStepView,
                    scriptSession,
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
    const { input, getStepView, engineToken, projectId, apiUrl, censoredInput, scriptSession } = params

    if (formulaEvaluator.containsWrapper(input)) {
        const formulaOptions = { engineToken, projectId, apiUrl, getStepView, censoredInput, scriptSession, contextVersion: params.contextVersion }
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

    return propsResolverUtils.replaceTokensAsync(input, async (_fullMatch, variableName) => {
        const result = await resolveSingleToken({
            ...resolveOptions,
            variableName: variableName.trim(),
            contextVersion: params.contextVersion,
        })
        return isString(result) ? result : JSON.stringify(result)
    })
}

const mergeFlattenedKeysArraysIntoOneArray = async (token: string, partsThatNeedResolving: string[],
    resolveOptions: Pick<ResolveInputInternalParams, 'engineToken' | 'projectId' | 'apiUrl' | 'getStepView' | 'censoredInput' | 'scriptSession'>,
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

export type PropsResolver = ReturnType<typeof createPropsResolver>

type PreResolveOptions = Pick<ResolveInputInternalParams, 'engineToken' | 'projectId' | 'apiUrl' | 'getStepView' | 'censoredInput' | 'contextVersion' | 'scriptSession'>

type ResolveInputInternalParams = {
    input: string
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
    getStepView: GetStepView
    contextVersion: ContextVersion | undefined
    scriptSession: SharedScriptSession
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
}
