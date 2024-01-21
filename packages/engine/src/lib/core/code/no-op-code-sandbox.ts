import { CodeSandbox } from '../../core/code/code-sandbox-common'

/**
 * Runs code without a sandbox.
 */
export const noOpCodeSandbox: CodeSandbox = {
    run({ codeModule, inputs }) {
        return codeModule.code(inputs)
    },
}
