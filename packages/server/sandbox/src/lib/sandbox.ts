import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, wideEvent } from '@activepieces/server-utils'
import { cacheUtils } from './cache/cache-paths'
import { clearMemoryCache } from './cache/cache-state'
import { localExecutionCache } from './cache/local-execution-cache'
import { clearPieceMemoryCache } from './cache/pieces/piece-installer'
import { createSandboxManager, SandboxManager } from './sandbox-manager'
import {
    ExecuteParams,
    Runtime,
    RuntimeExecutionResult,
    RuntimeExecutorInfo,
    SandboxSettings,
} from './types'

// One box per worker at the destination (concurrency 1), or N independent boxes in the transitional
// compatibility mode that honors AP_WORKER_CONCURRENCY. Each box is its own manager, holding one
// in-flight operation at a time; the worker runs one poll loop per box and routes each execute to its
// box by workerIndex. The boxes share the on-disk caches, which are already concurrency-safe
// (threadSafeMkdir / cache-state), so there is no per-key provision dedup here. execute owns the slot
// lifecycle: acquire -> provision -> run -> release on success / invalidate on throw, re-raising the
// sandbox ActivepiecesError codes (timeout / memory / log-size) that handlers already catch. See ADR 0004.
export function createSandboxRuntime({ concurrency = 1, basePath, getSettings, cleanCacheAfterRun = false, log: _log }: CreateSandboxRuntimeParams): Runtime {
    const managers: SandboxManager[] = Array.from({ length: concurrency }, (_, index) =>
        createSandboxManager({ boxId: index + 1, basePath, getSettings }),
    )

    return {
        async execute({ workerIndex, log, operationType, operation, timeoutInSeconds, provision }: ExecuteParams): Promise<RuntimeExecutionResult> {
            const manager = managers[workerIndex]
            if (isNil(manager)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: `No sandbox manager for worker index ${workerIndex} (concurrency=${concurrency})` },
                })
            }
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
                    // Break the engine timeline into its two worker-observable phases:
                    //   sandboxStart = fork the engine child + Node boot + parse main.js (V8-cached) +
                    //                  isolated-vm init + socket connect handshake.
                    //   sandboxRun   = send the operation + the engine runs the flow steps + returns.
                    // executionMs wraps both (total), so the report shows execution = start + run.
                    const result = await wideEvent.timed({
                        name: 'execution',
                        fn: async () => {
                            await wideEvent.timed({
                                name: 'sandboxStart',
                                fn: () => sandbox.start({
                                    flowVersionId: provision.flowVersionId,
                                    platformId: provision.platformId,
                                    mounts: [],
                                }),
                            })
                            return wideEvent.timed({
                                name: 'sandboxRun',
                                fn: () => sandbox.execute(operationType, operation, { timeoutInSeconds }),
                            })
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
            return managers
                .map((manager) => manager.getActiveSandbox())
                .filter((info) => !isNil(info))
                .map((info) => ({
                    sandboxId: info.sandboxId,
                    boxId: info.boxId,
                    pid: info.pid,
                    busy: info.busy,
                }))
        },
        async shutdown(shutdownLog: ApLogger): Promise<void> {
            await Promise.all(managers.map((manager) => manager.shutdown(shutdownLog)))
        },
    }
}

type CreateSandboxRuntimeParams = {
    concurrency?: number
    basePath: string
    getSettings: () => SandboxSettings
    cleanCacheAfterRun?: boolean
    log: ApLogger
}
