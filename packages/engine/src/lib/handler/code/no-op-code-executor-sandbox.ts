import { CodeExecutorSandbox } from './code-executor-common'

/**
 * Runs code without a sandbox.
 */
export const noOpCodeExecutorSandbox: CodeExecutorSandbox = {
    run({ codeModule, input }) {
        return codeModule.code(input)
    },
}
