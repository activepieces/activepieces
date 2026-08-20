import { initCodeSandbox } from '../core/code/code-sandbox'
import { utils } from '../utils'

export const scriptEvaluator = {
    async evaluate({ script, scriptContext }: EvaluateParams): Promise<unknown> {
        const { data: result, error: resultError } = await utils.tryCatchAndThrowOnEngineError(async () => {
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
}
