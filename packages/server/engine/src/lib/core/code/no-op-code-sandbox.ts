import { CodeSandbox } from '../../core/code/code-sandbox-common'

/**
 * Runs code without a sandbox.
 */
export const noOpCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeModule, inputs }) {
        return codeModule.code(inputs)
    },

    async runScript({ script, scriptContext, functions }) {
        const newContext = {
            ...scriptContext,
            ...functions,
        }   
        const params = Object.keys(newContext)
        const args = Object.values(newContext)
        const body = `return (${script})`
        const fn = Function(...params, body)
        return fn(...args)
    },
}
