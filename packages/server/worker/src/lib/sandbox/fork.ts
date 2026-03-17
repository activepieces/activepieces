import { fork } from 'child_process'
import { SandboxProcessMaker } from './types'

export function simpleProcess(enginePath: string, codeDirectory: string): SandboxProcessMaker {
    return {
        create: async (params) => {
            const memoryLimitMb = Math.floor(params.resourceLimits.memoryBytes / (1024 * 1024))
            return fork(enginePath, [], {
                execArgv: [
                    // IMPORTANT DO NOT REMOVE THIS ARGUMENT: https://github.com/laverdet/isolated-vm/issues/424
                    '--no-node-snapshot',
                    `--max-old-space-size=${memoryLimitMb}`,
                ],
                env: {
                    ...params.env,
                    AP_BASE_CODE_DIRECTORY: codeDirectory,
                    SANDBOX_ID: params.sandboxId,
                },
            })
        },
    }
}
