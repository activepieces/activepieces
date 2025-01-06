import { CodeSandbox, isCodeV2Module } from '../../core/code/code-sandbox-common'
import { CodeV2Context } from './code-v2'

/**
 * Runs code without a sandbox.
 */
export const noOpCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeModule, inputs }) {
        if (isCodeV2Module(codeModule)) {
            return codeModule.code.run({ inputs } as unknown as CodeV2Context)
        }
        return codeModule.code(inputs)
    },

    async runScript({ script, scriptContext }) {
        const params = Object.keys(scriptContext)
        const args = Object.values(scriptContext)
        const body = `return (${script})`
        const fn = Function(...params, body)
        return fn(...args)
    },
}
