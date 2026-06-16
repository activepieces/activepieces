import { type ApLogger } from '@activepieces/server-utils'
import { ApEnvironment, ExecutionMode, isNil, tryCatch, WorkerToApiContract } from '@activepieces/shared'
import { system, WorkerSystemProp } from '../../../config/configs'
import { workerSettings } from '../../../config/worker-settings'
import { getActiveProxyPort } from '../../../egress/lifecycle'
import { GLOBAL_CACHE_ROOT } from '../../cache/cache-paths'
import { PieceNotFoundError } from '../../cache/pieces/piece-cache'
import { cachePreparer } from '../../cache/preparer'
import { extractCodeArtifacts, extractPiecePackages } from '../../utils/flow-helpers'
import { Sandbox } from '../sandbox-contract'
import { ActiveSandboxInfo, FlowExecutionRuntime, ReadyOperation } from '../types'
import { createSandboxForJob } from './create-sandbox-for-job'

export function createWorkerPoolRuntime({ boxId }: { boxId: number }): FlowExecutionRuntime {
    let currentSandbox: Sandbox | null = null
    const proxyPort = getActiveProxyPort()

    const acquire = (log: ApLogger): Sandbox => {
        if (canReuseSandbox() && currentSandbox && currentSandbox.isReady()) {
            return currentSandbox
        }
        if (currentSandbox) {
            log.info('Sandbox not ready or not reusable, creating fresh one')
            currentSandbox.shutdown().catch((err) =>
                log.error({ err }, 'Error shutting down previous sandbox'),
            )
        }
        currentSandbox = createSandboxForJob({ log, boxId, reusable: canReuseSandbox(), proxyPort })
        return currentSandbox
    }

    const invalidate = async (log: ApLogger): Promise<void> => {
        if (currentSandbox) {
            log.info('Invalidating sandbox')
            const sb = currentSandbox
            currentSandbox = null
            await sb.shutdown()
        }
    }

    return {
        async ready({ operation, log, apiClient }): Promise<Sandbox> {
            await provisionForOperation({ operation, log, apiClient })

            const sandbox = acquire(log)
            try {
                await sandbox.start({
                    flowVersionId: operation.kind === 'FLOW' ? operation.flowVersion.id : undefined,
                    platformId: operation.platformId,
                    mounts: [],
                })
            }
            catch (e) {
                await invalidate(log)
                throw e
            }
            return sandbox
        },
        invalidate,
        async release(log: ApLogger): Promise<void> {
            if (!canReuseSandbox()) {
                await invalidate(log)
            }
        },
        async shutdown(log: ApLogger): Promise<void> {
            await invalidate(log)
        },
        getActiveSandbox(): ActiveSandboxInfo | null {
            if (isNil(currentSandbox) || !currentSandbox.isReady()) {
                return null
            }
            const pid = currentSandbox.getPid()
            if (isNil(pid)) {
                return null
            }
            return {
                sandboxId: currentSandbox.id,
                boxId,
                pid,
                busy: currentSandbox.isBusy(),
            }
        },
    }
}

// WORKER_POOL provisioning = populate the worker's local cache (pieces + code) so the local
// sandbox can run the operation. This is the provision phase hidden inside ready(): it is
// idempotent (the underlying installers short-circuit on a cache hit), so calling it per-run
// and again on enable (via the ON_ENABLE trigger-hook run) is cheap. It throws on any failure
// so ready() never hands back a sandbox that cannot run the operation; a flow with a missing
// piece is disabled first, then the error is rethrown. Piece-scoped ops fill exactly one piece.
async function provisionForOperation({ operation, log, apiClient }: {
    operation: ReadyOperation
    log: ApLogger
    apiClient: WorkerToApiContract
}): Promise<void> {
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

function canReuseSandbox(): boolean {
    const reuseSandbox = system.get(WorkerSystemProp.REUSE_SANDBOX)
    if (!isNil(reuseSandbox)) {
        return reuseSandbox === 'true'
    }
    const settings = workerSettings.getSettings()
    if (settings.ENVIRONMENT === ApEnvironment.DEVELOPMENT) {
        return true
    }
    const trustedModes = [ExecutionMode.SANDBOX_CODE_ONLY, ExecutionMode.UNSANDBOXED]
    if (trustedModes.includes(settings.EXECUTION_MODE as ExecutionMode)) {
        return true
    }
    return false
}
