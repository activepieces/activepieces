import { applyFunctionToValues, isNil, isString } from '@activepieces/shared'
import replaceAsync from 'string-replace-async'
import { initCodeSandbox } from '../core/code/code-sandbox'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { createConnectionService } from '../services/connections.service'

const VARIABLE_PATTERN = /\{\{(.*?)\}\}/g
const CONNECTIONS = 'connections'
const FLATTEN_NESTED_KEYS_PATTERN = /\{\{\s*flattenNestedKeys(.*?)\}\}/g

type PropsResolverParams = {
    engineToken: string
    projectId: string
    apiUrl: string
}

export const createPropsResolver = ({ engineToken, projectId, apiUrl }: PropsResolverParams) => {
    return {
        resolve: async <T = unknown>(params: ResolveInputParams): Promise<ResolveResult<T>> => {
            const { unresolvedInput, executionState } = params
            if (isNil(unresolvedInput)) {
                return {
                    resolvedInput: unresolvedInput as T,
                    censoredInput: unresolvedInput,
                }
            }
            const currentState = executionState.currentState()
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
                }))
            const censoredInput = await applyFunctionToValues<T>(
                unresolvedInput,
                (token) => resolveInputAsync({
                    ...resolveOptions,
                    input: token,
                    censoredInput: true,
                }))
            return {
                resolvedInput,
                censoredInput,
            }
        },
    }
}

const mergeFlattenedKeysArraysIntoOneArray = async (token: string, partsThatNeedResolving: string[],
    resolveOptions: Pick<ResolveInputInternalParams, 'engineToken' | 'projectId' | 'apiUrl' | 'currentState' | 'censoredInput'>) => {
    const resolvedValues: Record<string, unknown> = {}
    let longestResultLength = 0
    for (const tokenPart of partsThatNeedResolving) {
        const variableName = tokenPart.substring(2, tokenPart.length - 2)
        resolvedValues[tokenPart] = await resolveSingleToken({
            ...resolveOptions,
            variableName,
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
/** 
 * input: `Hello {{firstName}} {{lastName}}`
 * tokenThatNeedResolving: [`{{firstName}}`, `{{lastName}}`]
 */
async function resolveInputAsync(params: ResolveInputInternalParams): Promise<unknown> {
    const { input, currentState, engineToken, projectId, apiUrl, censoredInput } = params
    const tokensThatNeedResolving = input.match(VARIABLE_PATTERN)
    const inputContainsOnlyOneTokenToResolve = tokensThatNeedResolving !== null && tokensThatNeedResolving.length === 1 && tokensThatNeedResolving[0] === input
    const resolveOptions = {
        engineToken,
        projectId,
        apiUrl,
        currentState,
        censoredInput,
    }

    if (inputContainsOnlyOneTokenToResolve) {
        const trimmedInput = input.trim()
        const variableName = trimmedInput.substring(2, trimmedInput.length - 2)
        return resolveSingleToken({
            ...resolveOptions,
            variableName,
        })
    }
    const inputIncludesFlattenNestedKeysTokens = input.match(FLATTEN_NESTED_KEYS_PATTERN)
    if (!isNil(inputIncludesFlattenNestedKeysTokens) && !isNil(tokensThatNeedResolving)) {
        return mergeFlattenedKeysArraysIntoOneArray(input, tokensThatNeedResolving, resolveOptions)
    }

    return replaceAsync(input, VARIABLE_PATTERN, async (_fullMatch, variableName) => {
        const result = await resolveSingleToken({
            ...resolveOptions,
            variableName,
        })
        return isString(result) ? result : JSON.stringify(result)
    })
}

async function resolveSingleToken(params: ResolveSingleTokenParams): Promise<unknown> {
    const { variableName, currentState } = params
    const isConnection = variableName.startsWith(CONNECTIONS)
    if (isConnection) {
        return handleConnection(params)
    }
    return evalInScope(variableName, { ...currentState }, { flattenNestedKeys })
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
    const connection = await createConnectionService({ engineToken, projectId, apiUrl }).obtain(connectionName)
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
    try {
        const codeSandbox = await initCodeSandbox()

        const result = await codeSandbox.runScript({
            script: js,
            scriptContext: contextAsScope,
            functions,
        })
        return result ?? ''
    }
    catch (exception) {
        console.warn('[evalInScope] Error evaluating variable', exception)
        return ''
    }
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

type ResolveSingleTokenParams = {
    variableName: string
    currentState: Record<string, unknown>
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
}

type ResolveInputInternalParams = {
    input: string
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
    currentState: Record<string, unknown>
}

type ResolveInputParams = {
    unresolvedInput: unknown
    executionState: FlowExecutorContext
}

type ResolveResult<T = unknown> = {
    resolvedInput: T
    censoredInput: unknown
}
