import ivm from 'isolated-vm'
import { CodeExecutorSandbox, CodeModule } from './code-executor-common'

/**
 * Runs code in a V8 Isolate sandbox
 */
export const isolateCodeExecutorSandbox: CodeExecutorSandbox = {
    async run({ codeModule, inputs }) {
        const isolate = new ivm.Isolate({ memoryLimit: 128 })

        try {
            const sourceCode = serializeCodeModule(codeModule)

            const context = await isolate.createContext()
            await context.global.set('inputs', new ivm.ExternalCopy(inputs).copyInto())

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
