import { CodeSandbox } from '../../core/code/code-sandbox-common'

/**
 * Runs code without a sandbox.
 */
export const noOpCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeModule, inputs, timeoutMs }) {
        if (timeoutMs) {
            return Promise.race([
                codeModule.code(inputs),
                new Promise((_, reject) => setTimeout(
                    () => reject(new Error('Script execution timed out')),
                    timeoutMs,
                )),
            ])
        }
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
