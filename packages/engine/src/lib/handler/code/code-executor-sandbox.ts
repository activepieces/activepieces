import { CodeExecutorSandboxType } from '@activepieces/shared'
import { CodeExecutorSandbox } from './code-executor-common'
import { isolateCodeExecutorSandbox } from './isolate-code-executor-sandbox'
import { noOpCodeExecutorSandbox } from './no-op-code-executor-sandbox'

const CODE_EXECUTOR_SANDBOX_TYPE =
    (process.env.AP_CODE_EXECUTOR_SANDBOX_TYPE as CodeExecutorSandboxType | undefined)
    ?? CodeExecutorSandboxType.NO_OP

const getCodeExecutorSandbox = (): CodeExecutorSandbox => {
    const variants = new Map([
        [CodeExecutorSandboxType.ISOLATE, isolateCodeExecutorSandbox],
        [CodeExecutorSandboxType.NO_OP, noOpCodeExecutorSandbox],
    ])

    return variants.get(CODE_EXECUTOR_SANDBOX_TYPE) ?? noOpCodeExecutorSandbox
}

export const codeExecutorSandbox = getCodeExecutorSandbox()
