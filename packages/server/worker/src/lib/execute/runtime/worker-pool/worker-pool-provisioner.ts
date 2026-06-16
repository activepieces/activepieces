import { provisionFlowPieces } from '../../utils/flow-helpers'
import { RuntimeProvisioner } from '../types'

// WORKER_POOL provisioning = populate the worker's local cache (pieces + code) so the
// local sandbox can run the flow. `provision()` is idempotent: the underlying installers
// short-circuit on a cache hit, so calling it per-run (from every flow-scoped job handler)
// and again on enable (via the ON_ENABLE trigger-hook run) is cheap. The per-run call is
// the one that matters — the cache is per-worker and BullMQ jobs are not pinned to the
// worker that enabled the flow. GCP/Lambda provisioners instead build the per-flow Deploy
// unit and existence-check it (see ADR-0002).
export function createWorkerPoolProvisioner(): RuntimeProvisioner {
    return {
        provision(params): Promise<boolean> {
            return provisionFlowPieces(params)
        },
    }
}
