import { isNil, tryCatch } from '@activepieces/core-utils'
import { initCodeSandbox } from './code-sandbox'
import { CreateScriptSessionParams, ScriptSession } from './code-sandbox-common'

export function createSharedScriptSession(buildParams: () => Promise<CreateScriptSessionParams>): SharedScriptSession {
    let sessionPromise: Promise<ScriptSession> | null = null
    let disposed = false
    return {
        get: () => {
            if (isNil(sessionPromise)) {
                const creating = initCodeSandbox({ useDeno: true }).then(async (codeSandbox) => codeSandbox.createScriptSession(await buildParams()))
                creating.catch(() => {
                    if (!disposed && sessionPromise === creating) {
                        sessionPromise = null
                    }
                })
                sessionPromise = creating
            }
            return sessionPromise
        },
        dispose: async () => {
            disposed = true
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
