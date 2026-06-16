import { fork } from 'child_process'
import { SandboxProcessMaker } from '../../sandbox-contract'

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
                // Pipe stdout/stderr (instead of inheriting) so the sandbox can capture the
                // engine's native output as the best-effort fallback for the crash path —
                // an OOM-killed engine returns no HTTP body. The IPC channel is unused now
                // that the worker↔engine transport is loopback HTTP, but fork requires it.
                stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
                env: {
                    ...params.env,
                    AP_BASE_CODE_DIRECTORY: codeDirectory,
                    SANDBOX_ID: params.sandboxId,
                },
            })
        },
    }
}
