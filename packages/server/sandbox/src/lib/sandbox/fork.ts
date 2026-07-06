import { fork } from 'child_process'
import { SandboxProcessMaker } from './types'

export function simpleProcess(enginePath: string, codeDirectory: string): SandboxProcessMaker {
    return {
        create: async (params) => {
            return fork(enginePath, [], {
                // Pipe the child's stdout/stderr instead of inheriting them, so the sandbox can
                // capture native runtime output (uncaught-exception stacks, V8 "JavaScript heap out
                // of memory" aborts) that never travels over the RPC socket. Without this, a hard
                // engine crash surfaces only as an opaque "Worker exited with code 1 ... standardError=".
                silent: true,
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
