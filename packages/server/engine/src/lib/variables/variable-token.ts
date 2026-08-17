import { isNil } from '@activepieces/core-utils'

import { createVariableResolver } from '../piece-context/variable-resolver'

export const variableToken = {
    async handle(params: VariableTokenParams): Promise<unknown> {
        const { variableName, engineToken, projectId, apiUrl, censoredInput } = params
        const name = parseVariableName(variableName)
        if (isNil(name)) {
            return ''
        }
        if (censoredInput) {
            return '**REDACTED**'
        }
        return createVariableResolver({ engineToken, projectId, apiUrl }).obtain(name)
    },
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

const VARIABLES = 'variables'

type VariableTokenParams = {
    variableName: string
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
}
