import { isNil } from '@activepieces/core-utils'
import { initCodeSandbox } from '../../core/code/code-sandbox'
import { createConnectionResolver } from '../../piece-context/connection-resolver'
import { utils } from '../../utils'
import { propertyPath } from '../property-path'
import { propsResolverUtils } from './helpers'
import { ResolveSingleTokenParams } from './types'

export async function handleConnection(params: ResolveSingleTokenParams): Promise<unknown> {
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
    const { data: result, error: resultError } = await utils.tryCatchAndThrowOnEngineError((async () => {
        const segments = propertyPath.parse(js)
        if (!isNil(segments)) {
            const value = propertyPath.resolveValue({ segments, scope: contextAsScope })
            return propsResolverUtils.cloneResolvedValue(value) ?? ''
        }

        const codeSandbox = await initCodeSandbox()

        const result = await codeSandbox.runScript({
            script: js,
            scriptContext: contextAsScope,
            functions: { flattenNestedKeys: propsResolverUtils.flattenNestedKeys },
        })
        return result ?? ''
    }))

    if (resultError) {
        console.warn('[evalInScope] Error evaluating variable', resultError)
        return ''
    }
    return result ?? ''
}

export const CONNECTIONS = 'connections'
