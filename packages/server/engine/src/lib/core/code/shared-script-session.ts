import { isNil, tryCatch } from '@activepieces/core-utils'
import { initCodeSandbox } from './code-sandbox'
import { CreateScriptSessionParams, ScriptSession } from './code-sandbox-common'

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

export type SharedScriptSession = {
    get(): Promise<ScriptSession>
    dispose(): Promise<void>
}
