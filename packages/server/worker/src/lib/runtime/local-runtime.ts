import { createSandboxPool, type Runtime } from '@activepieces/sandbox-pool'
import { type ApLogger } from '@activepieces/server-utils'
import { sandboxConfig } from './sandbox-config'

// The LOCAL host: embeds the sandbox pool in the long-lived worker at concurrency N, with the
// cwd-relative cache base path. Just constructs the pool from the worker's config.
export function createLocalRuntime({ concurrency, log }: CreateLocalRuntimeParams): Runtime {
    return createSandboxPool({
        concurrency,
        basePath: sandboxConfig.getCacheBasePath(),
        getSettings: () => sandboxConfig.getSandboxPoolSettings(),
        log,
    })
}

type CreateLocalRuntimeParams = {
    concurrency: number
    log: ApLogger
}
