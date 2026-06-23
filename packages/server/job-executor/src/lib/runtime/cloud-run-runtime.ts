import { createSandboxPool, type Runtime } from '@activepieces/sandbox-pool'
import { type ApLogger } from '@activepieces/server-utils'
import { sandboxConfig } from './sandbox-config'

// The GCP_CLOUD_RUN host: the SAME sandbox pool as LOCAL, with an ephemeral-disk base cache path
// (AP_CACHE_BASE_PATH). Per-instance concurrency defaults to 1 — the instance is the tenant-isolation
// boundary, so Cloud Run scales horizontally (autoscaling instances 1:1 with concurrent jobs) rather than
// running many jobs per instance. An HTTP server (executor-server.ts) drives this pool's
// createExecution → provision → run → dispose per pushed job. See
// docs/adr/0001-gcp-cloud-run-is-the-pool-at-concurrency-1.md.
export function createCloudRunRuntime({ log, concurrency = 1 }: CreateCloudRunRuntimeParams): Runtime {
    return createSandboxPool({
        concurrency,
        basePath: sandboxConfig.getCacheBasePath(),
        getSettings: () => sandboxConfig.getSandboxPoolSettings(),
        log,
    })
}

type CreateCloudRunRuntimeParams = {
    log: ApLogger
    concurrency?: number
}
