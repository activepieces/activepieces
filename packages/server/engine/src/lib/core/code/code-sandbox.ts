import { isNil } from '@activepieces/core-utils'
import { EngineGenericError, ExecutionMode } from '@activepieces/shared'
import { CodeSandbox } from '../../core/code/code-sandbox-common'
import { DenoPermission } from './deno-code-sandbox'

export const EXECUTION_MODE = process.env.AP_EXECUTION_MODE as ExecutionMode | undefined

const loadNoOpCodeSandbox = async (): Promise<CodeSandbox> => {
    const noOpCodeSandboxModule = await import('./no-op-code-sandbox')
    return noOpCodeSandboxModule.noOpCodeSandbox
}

const loadV8IsolateSandbox = async (): Promise<CodeSandbox> => {
    const v8IsolateCodeSandboxModule = await import('./v8-isolate-code-sandbox')
    return v8IsolateCodeSandboxModule.v8IsolateCodeSandbox
}

const loadDenoCodeSandbox = async ({ permissions, codeStepMemoryLimitMb }: LoadDenoCodeSandboxParams): Promise<CodeSandbox> => {
    const denoCodeSandboxModule = await import('./deno-code-sandbox')
    return denoCodeSandboxModule.denoCodeSandbox({ permissions, codeStepMemoryLimitMb })
}

const CODE_ONLY_SANDBOX_MEMORY_LIMIT_MB = 128

const loadCodeSandbox = async ({ useDeno }: { useDeno: boolean }): Promise<CodeSandbox> => {
    const denoLoaders = {
        [ExecutionMode.UNSANDBOXED]: () => loadDenoCodeSandbox({
            permissions: [
                DenoPermission.WRITE_TMP,
                DenoPermission.READ_TMP,
                DenoPermission.NET,
                DenoPermission.ENV,
                DenoPermission.SYS,
            ],
            codeStepMemoryLimitMb: null,
        }),
        [ExecutionMode.SANDBOX_PROCESS]: () => loadDenoCodeSandbox({
            permissions: [
                DenoPermission.WRITE_TMP,
                DenoPermission.READ_TMP,
                DenoPermission.NET,
                DenoPermission.ENV,
                DenoPermission.SYS,
            ],
            codeStepMemoryLimitMb: null,
        }),
        [ExecutionMode.SANDBOX_CODE_ONLY]: () => loadDenoCodeSandbox({ permissions: [], codeStepMemoryLimitMb: CODE_ONLY_SANDBOX_MEMORY_LIMIT_MB }),
        [ExecutionMode.SANDBOX_CODE_AND_PROCESS]: () => loadDenoCodeSandbox({ permissions: [], codeStepMemoryLimitMb: CODE_ONLY_SANDBOX_MEMORY_LIMIT_MB }),
    }

    const legacyLoaders = {
        [ExecutionMode.UNSANDBOXED]: loadNoOpCodeSandbox,
        [ExecutionMode.SANDBOX_PROCESS]: loadNoOpCodeSandbox,
        [ExecutionMode.SANDBOX_CODE_ONLY]: loadV8IsolateSandbox,
        [ExecutionMode.SANDBOX_CODE_AND_PROCESS]: loadV8IsolateSandbox,
    }

    if (isNil(EXECUTION_MODE)) {
        throw new EngineGenericError('ExecutionModeNotSetError', 'AP_EXECUTION_MODE environment variable is not set')
    }

    const loaders = useDeno ? denoLoaders : legacyLoaders
    const loader = loaders[EXECUTION_MODE]
    if (isNil(loader)) {
        throw new EngineGenericError('InvalidExecutionModeError', `Invalid AP_EXECUTION_MODE: ${EXECUTION_MODE}`)
    }
    return loader()
}

const instances: Record<'deno' | 'legacy', CodeSandbox | null> = {
    deno: null,
    legacy: null,
}

export const initCodeSandbox = async ({ useDeno }: { useDeno: boolean }): Promise<CodeSandbox> => {
    const kind = useDeno ? 'deno' : 'legacy'
    if (instances[kind] === null) {
        instances[kind] = await loadCodeSandbox({ useDeno })
    }

    return instances[kind]
}

type LoadDenoCodeSandboxParams = {
    permissions: DenoPermission[]
    codeStepMemoryLimitMb: number | null
}
