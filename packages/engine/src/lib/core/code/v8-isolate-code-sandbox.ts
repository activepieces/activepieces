import ivm from 'isolated-vm'
import { CodeModule, CodeSandbox } from '../../core/code/code-sandbox-common'

const ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES = 128

/**
 * Runs code in a V8 Isolate sandbox
 */
export const v8IsolateCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeModule, inputs }) {
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

    async runScript({ script, scriptContext }) {
        const isolate = new ivm.Isolate({ memoryLimit: ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES })

        try {
            const isolateContext = await initIsolateContext({
                isolate,
                codeContext: scriptContext,
            })

            return await executeIsolate({
                isolate,
                isolateContext,
                code: script,
            })
        }
        finally {
            isolate.dispose()
        }
    },
}

const initIsolateContext = async ({ isolate, codeContext }: InitContextParams): Promise<ivm.Context> => {
    const isolateContext = await isolate.createContext()

    for (const [key, value] of Object.entries(codeContext)) {
        await isolateContext.global.set(key, new ivm.ExternalCopy(value).copyInto())
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
    const serializedCodeFunction = codeModule.code.toString()
    return `const code = ${serializedCodeFunction}; code(inputs);`
}

type InitContextParams = {
    isolate: ivm.Isolate
    codeContext: Record<string, unknown>
}

type ExecuteIsolateParams = {
    isolate: ivm.Isolate
    isolateContext: ivm.Context
    code: string
}
