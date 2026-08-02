import { isNil } from '@activepieces/core-utils'
import { utils } from '../../utils'
import { propertyPath } from '../property-path'
import { CONNECTIONS, handleConnection } from './connection-token'
import { propsResolverUtils } from './helpers'
import { GetStepView, ResolveSingleTokenParams, SharedScriptSession } from './types'
import { handleVariable, VARIABLES } from './variable-token'

export async function resolveSingleToken(params: ResolveSingleTokenParams): Promise<unknown> {
    const { variableName, getStepView, scriptSession } = params
    if (variableName.startsWith(VARIABLES)) {
        return handleVariable(params)
    }
    if (variableName.startsWith(CONNECTIONS)) {
        return handleConnection(params)
    }
    return evalStepToken({ variableName, getStepView, scriptSession })
}

async function evalStepToken({ variableName, getStepView, scriptSession }: {
    variableName: string
    getStepView: GetStepView
    scriptSession: SharedScriptSession
}): Promise<unknown> {
    const { data: result, error: resultError } = await utils.tryCatchAndThrowOnEngineError((async () => {
        const segments = propertyPath.parse(variableName)
        if (!isNil(segments) && segments.length > 0) {
            const stepView = await getStepView(segments[0])
            if (isNil(stepView)) {
                return ''
            }
            const value = propertyPath.resolveValue({ segments: segments.slice(1), scope: stepView })
            return propsResolverUtils.cloneResolvedValue(value) ?? ''
        }
        const session = await scriptSession.get()
        const scriptResult = await session.run(variableName)
        return scriptResult ?? ''
    }))

    if (resultError) {
        console.warn('[evalStepToken] Error evaluating variable', resultError)
        return ''
    }
    return result ?? ''
}
