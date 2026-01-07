import { CodeSandbox } from '../../core/code/code-sandbox-common'

/**
 * Runs code without a sandbox.
 */
export const noOpCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeModule, inputs }) {
        return codeModule.code(inputs)
    },

    async runBundle({ bundleCode, inputs }) {
        // Create a function that runs the bundle and then calls code(inputs)
        // The bundle should set globalThis.code
        const wrappedCode = `
            ${bundleCode}
            return code(inputs);
        `
        const fn = new Function('inputs', wrappedCode)
        return fn(inputs)
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
