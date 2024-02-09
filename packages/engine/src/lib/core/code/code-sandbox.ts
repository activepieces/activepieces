import { CodeSandboxType } from '@activepieces/shared'
import { CodeSandbox } from '../../core/code/code-sandbox-common'

const CODE_SANDBOX_TYPE =
    (process.env.AP_CODE_SANDBOX_TYPE as CodeSandboxType | undefined)
    ?? CodeSandboxType.NO_OP

const loadNoOpCodeSandbox = async (): Promise<CodeSandbox> => {
    const noOpCodeSandboxModule = await import('./no-op-code-sandbox')
    return noOpCodeSandboxModule.noOpCodeSandbox
}

const loadV8IsolateSandbox = async (): Promise<CodeSandbox> => {
    const v8IsolateCodeSandboxModule = await import('./v8-isolate-code-sandbox')
    return v8IsolateCodeSandboxModule.v8IsolateCodeSandbox
}

const loadCodeSandbox = async (): Promise<CodeSandbox> => {
    const loaders = new Map([
        [CodeSandboxType.NO_OP, loadNoOpCodeSandbox],
        [CodeSandboxType.V8_ISOLATE, loadV8IsolateSandbox],
    ])

    const loader = loaders.get(CODE_SANDBOX_TYPE) ?? loadNoOpCodeSandbox
    return loader()
}

let instance: CodeSandbox | null = null

export const initCodeSandbox = async (): Promise<CodeSandbox> => {
    if (instance === null) {
        instance = await loadCodeSandbox()
    }

    return instance
}
