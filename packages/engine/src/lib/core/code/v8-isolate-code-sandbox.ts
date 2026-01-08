/* eslint-disable @typescript-eslint/no-explicit-any */
import { CodeModule, CodeSandbox } from '../../core/code/code-sandbox-common'

const ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES = 128

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ivmCache: any
const getIvm = () => {
    if (!ivmCache) {
        ivmCache = require('isolated-vm')
    }
    return ivmCache as typeof import('isolated-vm')
}

/**
 * Runs code in a V8 Isolate sandbox
 */
export const v8IsolateCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeModule, inputs }) {
        const ivm = getIvm()
        const isolate = new ivm.Isolate({ memoryLimit: ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES })

        try {
            const isolateContext = await initIsolateContext({
                isolate,
                codeContext: {
                    inputs,
                },
            })

            const serializedCodeModule = serializeCodeModule(codeModule)

            return await executeIsolate({
                isolate,
                isolateContext,
                code: serializedCodeModule,
            })
        }
        finally {
            isolate.dispose()
        }
    },

    async runBundle({ bundleCode, inputs }) {
        const ivm = getIvm()
        const isolate = new ivm.Isolate({ memoryLimit: ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES })

        try {
            const isolateContext = await initIsolateContext({
                isolate,
                codeContext: {
                    inputs,
                },
            })

            const codeToExecute = `${bundleCode}\ncode(inputs);`

            return await executeIsolate({
                isolate,
                isolateContext,
                code: codeToExecute,
            })
        }
        finally {
            isolate.dispose()
        }
    },

    async runScript({ script, scriptContext, functions }) {
        const ivm = getIvm()
        const isolate = new ivm.Isolate({ memoryLimit: ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES })

        try {
            // It is to avoid strucutedClone issue of proxy objects / functions, It will throw cannot be cloned error.
            const isolateContext = await initIsolateContext({
                isolate,
                codeContext: JSON.parse(JSON.stringify(scriptContext)),
            })

            const serializedFunctions = Object.entries(functions).map(([key, value]) => `const ${key} = ${value.toString()};`).join('\n')
            const scriptWithFunctions = `${serializedFunctions}\n${script}`

            return await executeIsolate({
                isolate,
                isolateContext,
                code: scriptWithFunctions,
            })
        }
        finally {
            isolate.dispose()
        }
    },
}

const initIsolateContext = async ({ isolate, codeContext }: InitContextParams): Promise<any> => {
    const isolateContext = await isolate.createContext()
    const ivm = getIvm()
    const jail = isolateContext.global

    // Set up globalThis reference
    await jail.set('globalThis', jail.derefInto())

    // Patch: Custom fetch implementation for isolated-vm to handle cloning problem with Promise (see issue)
    if (typeof globalThis.fetch !== 'undefined') {
        const fetchCallback = new ivm.Callback(async (url: string, options?: any) => {
            try {
                // Try/catch on fetch
                let response: Response
                try {
                    response = await globalThis.fetch(url, options)
                } catch (e: any) {
                    // Could not fetch (network, DNS, etc)
                    return {
                        ok: false,
                        message: 'Failed to fetch API',
                        error: e?.message || 'unknown error',
                    }
                }

                // Defensive: If not a Response instance, error out
                if (!response || typeof response !== 'object' || typeof response.status !== 'number') {
                    return {
                        ok: false,
                        message: 'Fetch did not return a valid response',
                        error: 'Invalid response object',
                    }
                }

                // Try .text() and .arrayBuffer() in parallel; if one fails, report error
                let text: string, arrayBuffer: ArrayBuffer, uint8Array: Uint8Array
                try {
                    text = await response.text()
                    // This can error if body already consumed, so wrap with try/catch
                } catch (e: any) {
                    return {
                        ok: false,
                        message: 'Fetch response text() failed',
                        error: e?.message || 'Failed to read response text',
                    }
                }
                try {
                    arrayBuffer = await response.arrayBuffer()
                    uint8Array = new Uint8Array(arrayBuffer)
                } catch (e: any) {
                    uint8Array = new Uint8Array()
                }

                const headersObj: Record<string, string> = {}
                try {
                    response.headers.forEach((value, key) => {
                        headersObj[key] = value
                    });
                } catch {}

                const textCallback = new ivm.Callback(() => text)
                const jsonCallback = new ivm.Callback(() => {
                    try {
                        return JSON.parse(text)
                    } catch {
                        throw new Error('Invalid JSON response')
                    }
                })
                const arrayBufferCallback = new ivm.Callback(() => {
                    return new ivm.ExternalCopy(uint8Array).copyInto()
                })

                return {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    headers: headersObj,
                    url: response.url,
                    text: textCallback,
                    json: jsonCallback,
                    arrayBuffer: arrayBufferCallback,
                }
            } catch (error: any) {
                // The .text(), .arrayBuffer() or cloning threw a Promise, propagate error in plain object
                return {
                    ok: false,
                    message: 'Failed to fetch API',
                    error: '#<Promise> could not be cloned.'
                }
            }
        })

        await jail.set('fetch', fetchCallback)
    }

    // Set up user-provided context
    for (const [key, value] of Object.entries(codeContext)) {
        await jail.set(key, new ivm.ExternalCopy(value).copyInto())
    }

    return isolateContext
}

const executeIsolate = async ({ isolate, isolateContext, code }: ExecuteIsolateParams): Promise<unknown> => {
    const isolateScript = await isolate.compileScript(code)

    const outRef = await isolateScript.run(isolateContext, {
        reference: true,
        promise: true,
    })

    return outRef.copy()
}

const serializeCodeModule = (codeModule: CodeModule): string => {
    const serializedCodeFunction = Object.keys(codeModule)
        .reduce((acc, key) =>
            acc + `const ${key} = ${(codeModule as any)[key].toString()};`,
        '')

    // replace the exports.function_name with function_name
    return serializedCodeFunction.replace(/\(0, exports\.(\w+)\)/g, '$1') + 'code(inputs);'
}

type InitContextParams = {
    isolate: any
    codeContext: Record<string, unknown>
}

type ExecuteIsolateParams = {
    isolate: any
    isolateContext: unknown
    code: string
}
