import ivm from 'isolated-vm'
import { CodeSandbox } from '../../core/code/code-sandbox-common'

const ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES = 128

/**
 * Runs code in a V8 Isolate sandbox
 */
export const v8IsolateCodeSandbox: CodeSandbox = {
    async run({ code, codeContext }) {
        const isolate = new ivm.Isolate({ memoryLimit: ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES })

        try {
            const isolateContext = await initIsolateContext({
                isolate,
                codeContext,
            })

            return await executeIsolate({
                isolate,
                isolateContext,
                code,
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
    const sourceCode = `const code = ${code}; code();`
    const isolateScript = await isolate.compileScript(sourceCode)

    const outRef = await isolateScript.run(isolateContext, {
        reference: true,
        promise: true,
    })

    return outRef.copy()
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
