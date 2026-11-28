import { isNil, tryCatch } from '@activepieces/core-utils'
import { EngineGenericError } from '@activepieces/shared'
import { initCodeSandbox } from './code-sandbox'
import { CreateScriptSessionParams, ScriptSession } from './code-sandbox-common'

export function createSharedScriptSession(buildParams: () => Promise<CreateScriptSessionParams>): SharedScriptSession {
    let sessionPromise: Promise<ScriptSession> | null = null
    let disposed = false
    return {
        get: () => {
            if (disposed) {
                return Promise.reject(new EngineGenericError('ScriptSessionDisposedError', 'The script session was used after its operation ended'))
            }
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
        reset: async () => {
            const pendingSession = sessionPromise
            if (disposed || isNil(pendingSession)) {
                return
            }
            const { data: session } = await tryCatch(() => pendingSession)
            await session?.reset()
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
    reset(): Promise<void>
    dispose(): Promise<void>
}
