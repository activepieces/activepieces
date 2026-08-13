import { isNil } from '@activepieces/core-utils'
import { ContextVersion } from '@activepieces/pieces-framework'

import { createConnectionResolver } from '../piece-context/connection-resolver'
import { scriptEvaluator } from './script-evaluator'

export const connectionToken = {
    async handle(params: ConnectionTokenParams): Promise<unknown> {
        const { variableName, engineToken, projectId, apiUrl, censoredInput, contextVersion, pieceName } = params
        const connectionName = parseConnectionNameOnly(variableName)
        if (isNil(connectionName)) {
            return ''
        }
        if (censoredInput) {
            return '**REDACTED**'
        }
        const connection = await createConnectionResolver({ engineToken, projectId, apiUrl, contextVersion, pieceName }).obtain(connectionName)
        const pathAfterConnectionName = parsePathAfterConnectionName(variableName, connectionName)
        if (isNil(pathAfterConnectionName) || pathAfterConnectionName.length === 0) {
            return connection
        }
        return scriptEvaluator.evaluate({ script: pathAfterConnectionName, scriptContext: { connection } })
    },
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

type ConnectionTokenParams = {
    variableName: string
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
    contextVersion: ContextVersion | undefined
    pieceName?: string
}
