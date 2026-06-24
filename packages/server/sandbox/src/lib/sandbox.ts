import { isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, wideEvent } from '@activepieces/server-utils'
import { cacheUtils } from './cache/cache-paths'
import { clearMemoryCache } from './cache/cache-state'
import { localExecutionCache } from './cache/local-execution-cache'
import { clearPieceMemoryCache } from './cache/pieces/piece-installer'
import { createSandboxManager } from './sandbox-manager'
import {
    ExecuteParams,
    Runtime,
    RuntimeExecutionResult,
    RuntimeExecutorInfo,
    SandboxSettings,
} from './types'

// A single sandbox box. One manager, one in-flight operation at a time — concurrency is gated by the
// host (the worker's container pool or Cloud Run runs one box per container at request concurrency 1),
// so there is no slot allocation and no per-key provision dedup to do here. execute owns the slot
// lifecycle: acquire -> provision -> run -> release on success / invalidate on throw, re-raising the
// sandbox ActivepiecesError codes (timeout / memory / log-size) that handlers already catch.
export function createSandboxRuntime({ basePath, getSettings, cleanCacheAfterRun = false, log: _log }: CreateSandboxRuntimeParams): Runtime {
    const manager = createSandboxManager({ boxId: 1, basePath, getSettings })

    return {
        async execute({ log, operationType, operation, timeoutInSeconds, provision }: ExecuteParams): Promise<RuntimeExecutionResult> {
            try {
                const sandbox = manager.acquire({ log })

                const { error: provisionError } = await tryCatch(() => localExecutionCache(log, basePath, getSettings).provision({
                    pieces: provision.pieces,
                    codeSteps: provision.codes,
                    publicApiUrl: provision.publicApiUrl,
                    engineToken: provision.engineToken,
                }))
                if (provisionError) {
                    await manager.invalidate(log)
                    throw provisionError
                }

                try {
                    // Time the actual engine run (start child + execute one operation) separately from
                    // provisioning, so the wide event carries executionMs alongside installPiecesMs /
                    // flowBundleDownloadMs for a clean per-run breakdown.
                    const result = await wideEvent.timed({
                        name: 'execution',
                        fn: async () => {
                            await sandbox.start({
                                flowVersionId: provision.flowVersionId,
                                platformId: provision.platformId,
                                mounts: [],
                            })
                            return sandbox.execute(operationType, operation, { timeoutInSeconds })
                        },
                    })
                    await manager.release(log)
                    return result
                }
                catch (error) {
                    await manager.invalidate(log)
                    throw error
                }
            }
            finally {
                // Benchmark knob: wipe the per-run disk cache (pieces + compiled code + flow bundle) after
                // every run so the next one re-provisions cold — but KEEP the static engine bundle (its
                // install is then a no-op cache hit). Clear the in-memory cache layers too, or the next run
                // sees a stale "installed" entry and skips re-installing files that no longer exist on disk.
                if (cleanCacheAfterRun) {
                    await tryCatch(() => cacheUtils(basePath).cleanExceptEngine())
                    clearMemoryCache()
                    clearPieceMemoryCache()
                }
            }
        },
        getActiveExecutors(): RuntimeExecutorInfo[] {
            const info = manager.getActiveSandbox()
            if (isNil(info)) {
                return []
            }
            return [{
                sandboxId: info.sandboxId,
                boxId: info.boxId,
                pid: info.pid,
                busy: info.busy,
            }]
        },
        async shutdown(shutdownLog: ApLogger): Promise<void> {
            await manager.shutdown(shutdownLog)
        },
    }
}

type CreateSandboxRuntimeParams = {
    basePath: string
    getSettings: () => SandboxSettings
    cleanCacheAfterRun?: boolean
    log: ApLogger
}
