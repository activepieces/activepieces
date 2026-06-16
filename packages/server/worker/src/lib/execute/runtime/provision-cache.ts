import { type ApLogger } from '@activepieces/server-utils'
import { tryCatch, WorkerToApiContract } from '@activepieces/shared'
import { GLOBAL_CACHE_ROOT } from '../cache/cache-paths'
import { PieceNotFoundError } from '../cache/pieces/piece-cache'
import { cachePreparer } from '../cache/preparer'
import { extractCodeArtifacts, extractPiecePackages } from '../utils/flow-helpers'
import { ReadyOperation } from './types'

// Populate the local cache (pieces + compiled code) for an operation. This is the work the
// worker-pool runtime does before handing a sandbox a job, and the cloud-function runtime reuses
// it for co-located/dev engines that read the same on-disk cache. It is idempotent — the
// installers short-circuit on a cache hit — so it is cheap to call per run. It throws on any
// failure so callers never run against a half-populated cache; a flow with a missing piece is
// disabled first, then the error is rethrown.
export async function provisionLocalCache({ operation, log, apiClient }: ProvisionLocalCacheParams): Promise<void> {
    if (operation.kind === 'PIECE') {
        await cachePreparer(log, apiClient).prepare({ pieces: [operation.piece], codeSteps: [], cacheRoot: GLOBAL_CACHE_ROOT })
        return
    }

    const { flowVersion, platformId, flowId, projectId } = operation
    const { error } = await tryCatch(async () => {
        const pieces = await extractPiecePackages(flowVersion, platformId, log, apiClient)
        const codeSteps = extractCodeArtifacts(flowVersion)
        await cachePreparer(log, apiClient).prepare({ pieces, codeSteps, cacheRoot: GLOBAL_CACHE_ROOT })
    })
    if (error) {
        if (error instanceof PieceNotFoundError) {
            log.warn({ error: String(error), flowId }, 'Flow disabled due to missing piece')
            const { error: disableError } = await tryCatch(
                () => apiClient.disableFlow({ flowId, projectId }),
            )
            if (disableError) {
                log.error({ error: String(disableError), flowId }, 'Failed to disable flow after missing piece')
            }
        }
        throw error
    }
}

type ProvisionLocalCacheParams = {
    operation: ReadyOperation
    log: ApLogger
    apiClient: WorkerToApiContract
}
