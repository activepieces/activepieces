import { CodeExecutorSandbox, CodeExecutorSandboxType } from './code-executor-common'
import { isolateCodeExecutorSandbox } from './isolate-code-executor-sandbox'
import { noOpCodeExecutorSandbox } from './no-op-code-executor-sandbox'

const CODE_EXECUTOR_SANDBOX_TYPE =
    (process.env.AP_CODE_EXECUTOR_SANDBOX_TYPE as CodeExecutorSandboxType | undefined)
    ?? CodeExecutorSandboxType.NO_OP

const getCodeExecutorSandbox = (): CodeExecutorSandbox => {
    const variants: Record<CodeExecutorSandboxType, CodeExecutorSandbox> = {
        [CodeExecutorSandboxType.NO_OP]: noOpCodeExecutorSandbox,
        [CodeExecutorSandboxType.ISOLATE]: isolateCodeExecutorSandbox,
    }

    return variants[CODE_EXECUTOR_SANDBOX_TYPE]
}

export const codeExecutorSandbox = getCodeExecutorSandbox()
