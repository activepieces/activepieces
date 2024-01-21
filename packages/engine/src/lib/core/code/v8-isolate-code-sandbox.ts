import ivm from 'isolated-vm'
import { CodeSandbox, CodeModule } from '../../core/code/code-sandbox-common'

const ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES = 128
const INPUTS_VARIABLE_NAME = 'inputs'

/**
 * Runs code in a V8 Isolate sandbox
 */
export const v8IsolateCodeSandbox: CodeSandbox = {
    async run({ codeModule, inputs }) {
        const isolate = new ivm.Isolate({ memoryLimit: ONE_HUNDRED_TWENTY_EIGHT_MEGABYTES })

        try {
            const sourceCode = serializeCodeModule(codeModule)

            const context = await isolate.createContext()
            await context.global.set(INPUTS_VARIABLE_NAME, new ivm.ExternalCopy(inputs).copyInto())

            const script = await isolate.compileScript(sourceCode)

            const outRef = await script.run(context, {
                reference: true,
                promise: true,
            })

            return await outRef.copy()
        }
        finally {
            isolate.dispose()
        }
    },
}

const serializeCodeModule = (codeModule: CodeModule): string => {
    const serializedCode = codeModule.code.toString()
    return `const code = ${serializedCode};code(inputs);`
}
