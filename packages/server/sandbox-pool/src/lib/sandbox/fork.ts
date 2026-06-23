import { fork } from 'child_process'
import path from 'path'
import { ENGINE_COMPILE_CACHE_DIRNAME } from '../cache/cache-paths'
import { SandboxProcessMaker } from './types'

export function simpleProcess(enginePath: string, codeDirectory: string): SandboxProcessMaker {
    // The engine is one big bundled main.js, forked fresh per non-reused sandbox. Point Node at the
    // compile cache prewarmed into the image at build time so forks load the bundle's cached bytecode
    // instead of re-parsing it. Lives next to the engine (same dir the build-time prewarm writes to).
    const compileCacheDir = path.join(path.dirname(enginePath), ENGINE_COMPILE_CACHE_DIRNAME)
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
                    NODE_COMPILE_CACHE: compileCacheDir,
                },
            })
        },
    }
}
