import { CodeSandbox } from '../../core/code/code-sandbox-common'

/**
 * Runs code without a sandbox.
 */
export const noOpCodeSandbox: CodeSandbox = {
    run({ code, codeContext }) {
        const params = Object.keys(codeContext)
        const args = Object.values(codeContext)
        const body = `const code = ${code}; return code();`
        const fn = Function(...params, body)
        return fn(...args)
    },
}
