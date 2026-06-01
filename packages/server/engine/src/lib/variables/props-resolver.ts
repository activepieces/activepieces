import { ContextVersion } from '@activepieces/pieces-framework'
import { applyFunctionToValues, FormulaEvaluationError, formulaEvaluator, isNil, isString } from '@activepieces/shared'

import { initCodeSandbox } from '../core/code/code-sandbox'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { createConnectionResolver } from '../piece-context/connection-resolver'
import { createVariableResolver } from '../piece-context/variable-resolver'
import { utils } from '../utils'

const CONNECTIONS = 'connections'
const VARIABLES = 'variables'
// The non-greedy regex /{{(.?)}}/g stops at the first }} it sees,
// so expressions with nested braces (object literals, function calls) are
// truncated and resolve to "". Use a brace-counting tokenizer instead.
const FLATTEN_NESTED_KEYS_PATTERN = /\{\{\s*flattenNestedKeys(.*?)\}\}/g
function extractTokens(str: string): { token: string, inner: string, index: number }[] {
    const results: { token: string, inner: string, index: number }[] = []
    let i = 0
    while (i < str.length - 1) {
        if (str[i] === '{' && str[i + 1] === '{') {
            const start = i
            let depth = 1
            i += 2
            while (i < str.length - 1 && depth > 0) {
                if (str[i] === '{' && str[i + 1] === '{') { depth++; i += 2 }
                else if (str[i] === '}' && str[i + 1] === '}') { depth--; i += 2 }
                else { i++ }
            }
            if (depth === 0) {
                const token = str.slice(start, i)
                const inner = token.slice(2, -2).trim()
                results.push({ token, inner, index: start })
            }
        } else { i++ }
    }
    return results
}
async function replaceTokensAsync(
    str: string,
    replacer: (token: string, inner: string) => Promise<string>,
): Promise<string> {
    const tokens = extractTokens(str)
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
            const referencedStepNames = extractReferencedStepNames(unresolvedInput, stepNames)
            const currentState = await executionState.currentState(Array.from(referencedStepNames))
            const resolveOptions = {
                engineToken,
                projectId,
                apiUrl,
                currentState,
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
        },
    }
}

const mergeFlattenedKeysArraysIntoOneArray = async (token: string, partsThatNeedResolving: string[],
    resolveOptions: Pick<ResolveInputInternalParams, 'engineToken' | 'projectId' | 'apiUrl' | 'currentState' | 'censoredInput'>,
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
    const stringifiedInput = JSON.stringify(input)
    const referencedSteps = new Set<string>()
    for (const stepName of stepNames) {
        if (stringifiedInput.includes(stepName)) {
            referencedSteps.add(stepName)
        }
    }
    return referencedSteps
}

/** 
 * input: `Hello {{firstName}} {{lastName}}`
 * tokenThatNeedResolving: [`{{firstName}}`, `{{lastName}}`]
 */
async function resolveInputAsync(params: ResolveInputInternalParams): Promise<unknown> {
    const { input, currentState, engineToken, projectId, apiUrl, censoredInput } = params

    if (formulaEvaluator.containsWrapper(input)) {
        const formulaOptions = { engineToken, projectId, apiUrl, currentState, censoredInput, contextVersion: params.contextVersion }
        const { expression: preResolvedExpr, vars: preResolvedVars } = await preResolveFormulaVars({ expression: input, resolveOptions: formulaOptions })
        const { result, error } = formulaEvaluator.evaluate({ expression: preResolvedExpr, sampleData: preResolvedVars })
        if (error) {
            throw new FormulaEvaluationError({ expression: input, message: error })
        }
        return result ?? ''
    }

    const tokensThatNeedResolving = extractTokens(input)
    const resolveOptions = {
        engineToken,
        projectId,
        apiUrl,
        currentState,
        censoredInput,
    }
    const inputContainsOnlyOneTokenToResolve =
        tokensThatNeedResolving.length === 1 &&
        tokensThatNeedResolving[0].token === input.trim()

    if (inputContainsOnlyOneTokenToResolve) {
        const variableName = tokensThatNeedResolving[0].inner
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
            variableName,
            contextVersion: params.contextVersion,
        })
        return isString(result) ? result : JSON.stringify(result)
    })
}

async function resolveSingleToken(params: ResolveSingleTokenParams): Promise<unknown> {
    const { variableName, currentState } = params
    if (variableName.startsWith(VARIABLES)) {
        return handleVariable(params)
    }
    if (variableName.startsWith(CONNECTIONS)) {
        return handleConnection(params)
    }
    return evalInScope(variableName, { ...currentState }, { flattenNestedKeys })
}

async function handleVariable(params: ResolveSingleTokenParams): Promise<unknown> {
    const { variableName, engineToken, projectId, apiUrl, censoredInput } = params
    const name = parseVariableName(variableName)
    if (isNil(name)) {
        return ''
    }
    if (censoredInput) {
        return '**REDACTED**'
    }
    return createVariableResolver({ engineToken, projectId, apiUrl }).obtain(name)
}

function parseVariableName(variableName: string): string | null {
    if (variableName.startsWith(`${VARIABLES}[`)) {
        const match = variableName.match(/\['([^']+)'\]/)
        return match ? match[1] : null
    }
    if (variableName.startsWith(`${VARIABLES}.`)) {
        return variableName.split('.')[1] ?? null
    }
    return null
}

async function handleConnection(params: ResolveSingleTokenParams): Promise<unknown> {
    const { variableName, engineToken, projectId, apiUrl, censoredInput } = params
    const connectionName = parseConnectionNameOnly(variableName)
    if (isNil(connectionName)) {
        return ''
    }
    if (censoredInput) {
        return '**REDACTED**'
    }
    const connection = await createConnectionResolver({ engineToken, projectId, apiUrl, contextVersion: params.contextVersion }).obtain(connectionName)
    const pathAfterConnectionName = parsePathAfterConnectionName(variableName, connectionName)
    if (isNil(pathAfterConnectionName) || pathAfterConnectionName.length === 0) {
        return connection
    }
    return evalInScope(pathAfterConnectionName, { connection }, { flattenNestedKeys })
}

function parsePathAfterConnectionName(variableName: string, connectionName: string): string | null {
    if (variableName.includes('[')) {
        return variableName.substring(`connections.['${connectionName}']`.length)
    }
    const cp = variableName.substring(`connections.${connectionName}`.length)
    if (cp.length === 0) {
        return cp
    }
    return `connection${cp}`
}

function parseConnectionNameOnly(variableName: string): string | null {
    const connectionWithNewFormatSquareBrackets = variableName.includes('[')
    if (connectionWithNewFormatSquareBrackets) {
        return parseSquareBracketConnectionPath(variableName)
    }
    // {{connections.connectionName.path}}
    // This does not work If connectionName contains .
    return variableName.split('.')?.[1]
}

function parseSquareBracketConnectionPath(variableName: string): string | null {
    // Find the connection name inside {{connections['connectionName'].path}}
    const matches = variableName.match(/\['([^']+)'\]/g)
    if (matches && matches.length >= 1) {
        // Remove the square brackets and quotes from the connection name

        const secondPath = matches[0].replace(/\['|'\]/g, '')
        return secondPath
    }
    return null
}

// eslint-disable-next-line @typescript-eslint/ban-types
async function evalInScope(js: string, contextAsScope: Record<string, unknown>, functions: Record<string, Function>): Promise<unknown> {
    const { data: result, error: resultError } = await utils.tryCatchAndThrowOnEngineError((async () => {
        const codeSandbox = await initCodeSandbox()

        const result = await codeSandbox.runScript({
            script: js,
            scriptContext: contextAsScope,
            functions,
        })
        return result ?? ''
    }))

    if (resultError) {
        console.warn('[evalInScope] Error evaluating variable', resultError)
        return ''
    }
    return result ?? ''
}

function flattenNestedKeys(data: unknown, pathToMatch: string[]): unknown[] {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
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

type PreResolveOptions = Pick<ResolveInputInternalParams, 'engineToken' | 'projectId' | 'apiUrl' | 'currentState' | 'censoredInput' | 'contextVersion'>

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

type ResolveSingleTokenParams = {
    variableName: string
    currentState: Record<string, unknown>
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
    contextVersion: ContextVersion | undefined
}

type ResolveInputInternalParams = {
    input: string
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
    currentState: Record<string, unknown>
    contextVersion: ContextVersion | undefined
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
