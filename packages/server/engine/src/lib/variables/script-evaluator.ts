import { isNil } from '@activepieces/core-utils'

import { initCodeSandbox } from '../core/code/code-sandbox'
import { createSharedScriptSession, SharedScriptSession } from '../core/code/shared-script-session'
import { utils } from '../utils'

export const scriptEvaluator = {
    initSession(): SharedScriptSession {
        return createSharedScriptSession(async () => ({
            scriptContext: {},
            functions: { flattenNestedKeys },
        }))
    },
    async evaluate({ script, scriptContext, scriptSession }: EvaluateParams): Promise<unknown> {
        const { data: result, error: resultError } = await utils.tryCatchAndThrowOnEngineError(async () => {
            if (!isNil(scriptSession)) {
                const session = await scriptSession.get()
                return await session.run(script) ?? ''
            }
            const codeSandbox = await initCodeSandbox()
            const scriptResult = await codeSandbox.runScript({
                script,
                scriptContext: scriptContext ?? {},
                functions: { flattenNestedKeys },
            })
            return scriptResult ?? ''
        })

        if (resultError) {
            console.warn('[scriptEvaluator.evaluate] Error evaluating variable', resultError)
            return ''
        }
        return result ?? ''
    },
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

type EvaluateParams = {
    script: string
    scriptContext?: Record<string, unknown>
    scriptSession?: SharedScriptSession
}
