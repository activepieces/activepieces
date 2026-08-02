import { isNil, tryCatch } from '@activepieces/core-utils'
import { initCodeSandbox } from '../../core/code/code-sandbox'
import { CreateScriptSessionParams, ScriptSession } from '../../core/code/code-sandbox-common'
import { GetStepView, SharedScriptSession } from './types'

export function createSharedScriptSession(buildParams: () => Promise<CreateScriptSessionParams>): SharedScriptSession {
    let sessionPromise: Promise<ScriptSession> | null = null
    return {
        get: () => {
            if (isNil(sessionPromise)) {
                sessionPromise = initCodeSandbox().then(async (codeSandbox) => codeSandbox.createScriptSession(await buildParams()))
            }
            return sessionPromise
        },
        dispose: async () => {
            const pendingSession = sessionPromise
            if (isNil(pendingSession)) {
                return
            }
            const { data: session } = await tryCatch(() => pendingSession)
            session?.dispose()
        },
    }
}

export async function buildScriptContext({ referencedStepNames, getStepView }: {
    referencedStepNames: Set<string>
    getStepView: GetStepView
}): Promise<Record<string, unknown>> {
    const scriptContext: Record<string, unknown> = {}
    for (const stepName of referencedStepNames) {
        const view = await getStepView(stepName)
        if (view !== undefined) {
            scriptContext[stepName] = view
        }
    }
    return scriptContext
}
