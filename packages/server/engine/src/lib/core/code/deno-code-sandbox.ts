import { existsSync } from 'node:fs'
import { realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { deno, DenoPermission, DenoSession } from '@activepieces/core-utils'
import { ExecutionMode } from '@activepieces/shared'
import { CodeSandbox } from './code-sandbox-common'

export { DenoPermission } from '@activepieces/core-utils'

export function denoCodeSandbox(permissions: DenoPermission[]): CodeSandbox {
    const sandbox: CodeSandbox = {
        async runCodeModule({ codeFilePath, inputs }) {
            // Deno compares permission paths after resolving symlinks (e.g. macOS
            // /var -> /private/var), so the grant must be on the real path.
            const realCodePath = await realpath(codeFilePath)
            const stepDir = dirname(realCodePath)
            const entryUrl = pathToFileURL(realCodePath).href
            const rawEsmSiblingPath = join(stepDir, 'index.ts')
            const asyncModuleRetryUrl = realCodePath.endsWith('.cjs') && existsSync(rawEsmSiblingPath)
                ? pathToFileURL(rawEsmSiblingPath).href
                : entryUrl

            return deno.run({
                body: `
    const { createRequire } = await import('node:module');
    const { readFileSync } = await import('node:fs');
    globalThis.require = createRequire(${JSON.stringify(entryUrl)});
    const source = readFileSync(${JSON.stringify(realCodePath)}, 'utf8');
    const hasEsmSyntax = /^[ \\t]*(import|export)\\s/m.test(source);
    const hasCjsExports = /\\b(module\\.exports|exports\\.[$A-Za-z_]|exports\\[)/.test(source);
    let mod;
    if (!hasEsmSyntax && hasCjsExports) {
        try {
            mod = globalThis.require(${JSON.stringify(realCodePath)});
        }
        catch (error) {
            if (error?.code !== 'ERR_REQUIRE_ASYNC_MODULE') {
                throw error;
            }
            mod = await import(${JSON.stringify(asyncModuleRetryUrl)});
        }
    }
    else {
        try {
            mod = await import(${JSON.stringify(entryUrl)});
        }
        catch (error) {
            const isCommonJsSignature = error instanceof ReferenceError && /\\b(exports|module) is not defined\\b/.test(String(error));
            if (!isCommonJsSignature) {
                throw error;
            }
            mod = globalThis.require(${JSON.stringify(realCodePath)});
        }
    }
    if (typeof mod.code !== 'function') {
        throw new Error('Code step must export a "code" function');
    }
    const result = await mod.code(${JSON.stringify(inputs)});
`,
                permissions,
                cwd: stepDir,
                allowReadPaths: [stepDir],
                resolveNodeModules: true,
                env: buildPropagatedEnv(permissions),
                denoDirBase: resolveDenoDirBase(stepDir),
            })
        },

        async runScript({ script, scriptContext, functions }) {
            const serializedFunctions = Object.entries(functions).map(([key, value]) => `const ${key} = ${value.toString()};`).join('\n')

            return deno.run({
                body: `
    Object.assign(globalThis, ${JSON.stringify(scriptContext)});
    const result = await (0, eval)(${JSON.stringify(`${serializedFunctions}\n(${script})`)});
`,
                permissions: [],
                cwd: tmpdir(),
            })
        },

        async createScriptSession({ scriptContext, functions }) {
            const context: Record<string, unknown> = { ...scriptContext }
            const bootstrapBody = Object.entries(functions).map(([key, value]) => `globalThis[${JSON.stringify(key)}] = ${value.toString()};`).join('\n')
            let current: LiveScriptSession | null = null
            let spawnInFlight: Promise<LiveScriptSession> | null = null
            let disposed = false

            // Single-flight respawn: concurrent runs that find the child dead share one new
            // spawn instead of each starting (and leaking) their own. The liveness check and
            // the decision to spawn are synchronous, so no caller can clobber another's child.
            const ensureLive = (): Promise<LiveScriptSession> => {
                if (current !== null && current.session.isAlive()) {
                    return Promise.resolve(current)
                }
                if (spawnInFlight === null) {
                    current = null
                    spawnInFlight = deno.createSession({
                        bootstrapBody,
                        permissions: [],
                        cwd: tmpdir(),
                    }).then((session) => {
                        const live = { session, sentGlobals: new Map<string, SentGlobal>() }
                        current = live
                        spawnInFlight = null
                        return live
                    }).catch((error) => {
                        spawnInFlight = null
                        throw error
                    })
                }
                return spawnInFlight
            }

            const syncGlobals = async ({ session, sentGlobals }: LiveScriptSession): Promise<void> => {
                await Promise.all(Object.entries(context).map(([key, value]) => {
                    const alreadySent = sentGlobals.get(key)
                    if (alreadySent !== undefined && alreadySent.value === value) {
                        return alreadySent.send
                    }
                    const send = session.setGlobal({ key, value })
                    sentGlobals.set(key, { value, send })
                    send.catch(() => {
                        if (sentGlobals.get(key)?.send === send) {
                            sentGlobals.delete(key)
                        }
                    })
                    return send
                }))
            }

            return {
                run: async (script: string) => {
                    if (disposed) {
                        throw new Error('Script session has been disposed')
                    }
                    const live = await ensureLive()
                    await syncGlobals(live)
                    return live.session.run({ script })
                },
                setGlobal: async (key: string, value: unknown, noOverwrite = true) => {
                    if (noOverwrite && (key in context || key in functions)) {
                        return
                    }
                    context[key] = value
                },
                dispose: () => {
                    disposed = true
                    current?.session.dispose()
                    spawnInFlight?.then(({ session }) => session.dispose()).catch(() => undefined)
                    current = null
                    spawnInFlight = null
                },
            }
        },
    }
    return sandbox
}

function resolveDenoDirBase(stepDir: string): string | undefined {
    return process.env['AP_EXECUTION_MODE'] === ExecutionMode.SANDBOX_CODE_ONLY ? stepDir : undefined
}

function buildPropagatedEnv(permissions: DenoPermission[]): Record<string, string> {
    const envAllowed = permissions.includes(DenoPermission.ENV) || permissions.includes(DenoPermission.ALL)
    if (!envAllowed) {
        return {}
    }
    const propagatedNames = (process.env['AP_SANDBOX_PROPAGATED_ENV_VARS'] ?? '').split(',').map((name) => name.trim()).filter((name) => name.length > 0)
    const env: Record<string, string> = {}
    for (const name of propagatedNames) {
        const value = process.env[name]
        if (value !== undefined) {
            env[name] = value
        }
    }
    return env
}

type SentGlobal = {
    value: unknown
    send: Promise<void>
}

type LiveScriptSession = {
    session: DenoSession
    sentGlobals: Map<string, SentGlobal>
}
