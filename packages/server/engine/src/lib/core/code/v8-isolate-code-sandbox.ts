/* eslint-disable @typescript-eslint/no-explicit-any */
import { CodeModule, CodeSandbox } from '../../core/code/code-sandbox-common'

const ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES = 128

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Check this https://github.com/laverdet/isolated-vm/issues/258#issuecomment-2134341086
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
