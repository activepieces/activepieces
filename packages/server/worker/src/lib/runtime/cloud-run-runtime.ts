import { type Runtime } from '@activepieces/sandbox-pool'

// The GCP_CLOUD_RUN host: the same pool at concurrency 1 with an ephemeral-disk base cache path,
// driven by an HTTP server that pushes one job per request. Not implemented yet — see
// docs/adr/0001-gcp-cloud-run-is-the-pool-at-concurrency-1.md.
export function createCloudRunRuntime(): Runtime {
    throw new Error('GCP_CLOUD_RUN runtime is not implemented yet')
}
