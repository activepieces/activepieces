import { applyFunctionToValues, isNil, isString } from '@activepieces/shared'
import replaceAsync from 'string-replace-async'
import { initCodeSandbox } from '../core/code/code-sandbox'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { createConnectionService } from '../services/connections.service'

const VARIABLE_PATTERN = RegExp('\\{\\{(.*?)\\}\\}', 'g')
const CONNECTIONS = 'connections'

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
                JSON.parse(JSON.stringify(unresolvedInput)),
                (token) => resolveInputAsync({
                    ...resolveOptions,
                    token,
                    censoredInput: false,
                }))
            const censoredInput = await applyFunctionToValues<T>(
                JSON.parse(JSON.stringify(unresolvedInput)),
                (token) => resolveInputAsync({
                    ...resolveOptions,
                    token,
                    censoredInput: true,
                }))
            return {
                resolvedInput,
                censoredInput,
            }
        },
    }
}

export type PropsResolver = ReturnType<typeof createPropsResolver>

async function resolveInputAsync(params: ResolveInputInternalParams): Promise<unknown> {
    const { token, currentState, engineToken, projectId, apiUrl, censoredInput } = params
    const matchedTokens = token.match(VARIABLE_PATTERN)
    const isSingleTokenWithoutAnyText = matchedTokens !== null && matchedTokens.length === 1 && matchedTokens[0] === token
    const resolveOptions = {
        engineToken,
        projectId,
        apiUrl,
        currentState,
        censoredInput,
    }
    if (isSingleTokenWithoutAnyText) {
        const variableName = token.substring(2, token.length - 2)
        return resolveSingleToken({
            ...resolveOptions,
            variableName,
        })
    }
    return replaceAsync(token, VARIABLE_PATTERN, async (_fullMatch, variableName) => {
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
    return evalInScope(variableName, currentState)
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
    return evalInScope(pathAfterConnectionName, { connection })
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

async function evalInScope(js: string, contextAsScope: Record<string, unknown>): Promise<unknown> {
    try {
        const codeSandbox = await initCodeSandbox()
        const result = await codeSandbox.runScript({
            script: js,
            scriptContext: contextAsScope,
        })
        return result ?? ''
    }
    catch (exception) {
        console.warn('[evalInScope] Error evaluating variable', exception)
        return ''
    }
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
    token: string
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
