import { CodeExecutorSandbox } from './code-executor-common'

/**
 * Runs code without a sandbox.
 */
export const noOpCodeExecutorSandbox: CodeExecutorSandbox = {
    run({ codeModule, inputs }) {
        return codeModule.code(inputs)
    },
}
