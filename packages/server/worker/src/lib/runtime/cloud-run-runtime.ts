import { createSandboxPool, type Runtime } from '@activepieces/sandbox-pool'
import { type ApLogger } from '@activepieces/server-utils'
import { sandboxConfig } from './sandbox-config'

// The GCP_CLOUD_RUN host: the SAME sandbox pool as LOCAL, fixed at concurrency 1 with an ephemeral-disk
// base cache path (AP_CACHE_BASE_PATH). The instance is the tenant-isolation boundary, so Cloud Run
// autoscales instances 1:1 with concurrent jobs. An HTTP server (cloud-run-server.ts) drives this pool's
// createExecution → provision → run → dispose per pushed job. See
// docs/adr/0001-gcp-cloud-run-is-the-pool-at-concurrency-1.md.
export function createCloudRunRuntime({ log }: CreateCloudRunRuntimeParams): Runtime {
    return createSandboxPool({
        concurrency: 1,
        basePath: sandboxConfig.getCacheBasePath(),
        getSettings: () => sandboxConfig.getSandboxPoolSettings(),
        log,
    })
}

type CreateCloudRunRuntimeParams = {
    log: ApLogger
}
