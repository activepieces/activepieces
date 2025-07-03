import { assertNotNullOrUndefined, ExecutionMode } from '@activepieces/shared'
import { CodeSandbox } from '../../core/code/code-sandbox-common'

export const EXECUTION_MODE = (process.env.AP_EXECUTION_MODE as ExecutionMode)

const loadNoOpCodeSandbox = async (): Promise<CodeSandbox> => {
    const noOpCodeSandboxModule = await import('./no-op-code-sandbox')
    return noOpCodeSandboxModule.noOpCodeSandbox
}

const loadV8IsolateSandbox = async (): Promise<CodeSandbox> => {
    const v8IsolateCodeSandboxModule = await import('./v8-isolate-code-sandbox')
    return v8IsolateCodeSandboxModule.v8IsolateCodeSandbox
}

const loadCodeSandbox = async (): Promise<CodeSandbox> => {
    const loaders = {
        [ExecutionMode.UNSANDBOXED]: loadNoOpCodeSandbox,
        [ExecutionMode.SANDBOXED]: loadNoOpCodeSandbox,
        [ExecutionMode.SANDBOX_CODE_ONLY]: loadV8IsolateSandbox,
    }
    assertNotNullOrUndefined(EXECUTION_MODE, 'AP_EXECUTION_MODE')
    const loader = loaders[EXECUTION_MODE]
    return loader()
}

let instance: CodeSandbox | null = null

export const initCodeSandbox = async (): Promise<CodeSandbox> => {
    if (instance === null) {
        instance = await loadCodeSandbox()
    }

    return instance
}
