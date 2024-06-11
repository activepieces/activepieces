import { ExecutionMode } from '@activepieces/shared'
import { CodeSandbox } from '../../core/code/code-sandbox-common'

const EXECUTION_MODE_TYPE = (process.env.AP_EXECUTION_MODE as ExecutionMode) ?? ExecutionMode.CODE_SANDBOXED

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
        [ExecutionMode.UNSANDBOXED, loadNoOpCodeSandbox],
        [ExecutionMode.SANDBOXED, loadNoOpCodeSandbox],
        [ExecutionMode.CODE_SANDBOXED, loadV8IsolateSandbox],
    ])

    const loader = loaders.get(EXECUTION_MODE_TYPE) ?? loadNoOpCodeSandbox
    return loader()
}

let instance: CodeSandbox | null = null

export const initCodeSandbox = async (): Promise<CodeSandbox> => {
    if (instance === null) {
        instance = await loadCodeSandbox()
    }

    return instance
}
