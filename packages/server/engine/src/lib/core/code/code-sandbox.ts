import { isNil } from '@activepieces/core-utils'
import { EngineGenericError, ExecutionMode } from '@activepieces/shared'
import { CodeSandbox } from '../../core/code/code-sandbox-common'
import { DenoPermission } from './deno-code-sandbox'

export const EXECUTION_MODE = process.env.AP_EXECUTION_MODE as ExecutionMode | undefined

const loadDenoCodeSandbox = async ({ permissions, codeStepMemoryLimitMb }: LoadDenoCodeSandboxParams): Promise<CodeSandbox> => {
    const denoCodeSandboxModule = await import('./deno-code-sandbox')
    return denoCodeSandboxModule.denoCodeSandbox({ permissions, codeStepMemoryLimitMb })
}

const CODE_ONLY_SANDBOX_MEMORY_LIMIT_MB = 128

const loadCodeSandbox = async (): Promise<CodeSandbox> => {
    const loaders = {
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

    if (isNil(EXECUTION_MODE)) {
        throw new EngineGenericError('ExecutionModeNotSetError', 'AP_EXECUTION_MODE environment variable is not set')
    }

    const loader = loaders[EXECUTION_MODE]
    if (isNil(loader)) {
        throw new EngineGenericError('InvalidExecutionModeError', `Invalid AP_EXECUTION_MODE: ${EXECUTION_MODE}`)
    }
    return loader()
}

let instance: CodeSandbox | null = null

export const initCodeSandbox = async (): Promise<CodeSandbox> => {
    if (instance === null) {
        instance = await loadCodeSandbox()
    }
    return instance
}

type LoadDenoCodeSandboxParams = {
    permissions: DenoPermission[]
    codeStepMemoryLimitMb: number | null
}
