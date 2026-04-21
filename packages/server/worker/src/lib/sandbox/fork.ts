import { fork } from 'child_process'
import { SandboxProcessMaker } from './types'

export function simpleProcess(enginePath: string, codeDirectory: string): SandboxProcessMaker {
    return {
        create: async (params) => {
            return fork(enginePath, [], {
                execArgv: [
                    // IMPORTANT DO NOT REMOVE THIS ARGUMENT: https://github.com/laverdet/isolated-vm/issues/424
                    '--no-node-snapshot',
                    '--expose-gc',
                    `--max-old-space-size=${params.resourceLimits.memoryLimitMb}`,
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
