import { CodeSandbox } from '../../core/code/code-sandbox-common'

/**
 * Runs code without a sandbox.
 */
export const noOpCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeModule, inputs }) {
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
