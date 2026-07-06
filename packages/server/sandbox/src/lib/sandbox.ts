import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, wideEvent } from '@activepieces/server-utils'
import { PiecePackage } from '@activepieces/shared'
import { localExecutionCache } from './cache/local-execution-cache'
import { createResolver } from './resolver'
import { createSandboxManager, SandboxManager } from './sandbox-manager'
import {
    CodeArtifact,
    ExecuteParams,
    PreWarmSandboxParams,
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
export function createSandboxRuntime({ concurrency = 1, basePath, getSettings }: CreateSandboxRuntimeParams): Runtime {
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
            const sandbox = manager.acquire({ log })

            const provisionStartedAt = Date.now()
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
            const provisionMs = Date.now() - provisionStartedAt

            try {
                let bootMs = 0
                let runMs = 0
                // Break the engine timeline into its two worker-observable phases:
                //   sandboxStart = fork the engine child + Node boot + parse main.js (V8-cached) +
                //                  isolated-vm init + socket connect handshake.
                //   sandboxRun   = send the operation + the engine runs the flow steps + returns.
                // executionMs wraps both (total), so the report shows execution = start + run.
                const result = await wideEvent.timed({
                    name: 'execution',
                    fn: async () => {
                        const bootStartedAt = Date.now()
                        await wideEvent.timed({
                            name: 'sandboxStart',
                            fn: () => sandbox.start({
                                flowVersionId: provision.flowVersionId,
                                platformId: provision.platformId,
                                mounts: [],
                            }),
                        })
                        bootMs = Date.now() - bootStartedAt
                        const runStartedAt = Date.now()
                        const runResult = await wideEvent.timed({
                            name: 'sandboxRun',
                            fn: () => sandbox.execute(operationType, operation, { timeoutInSeconds }),
                        })
                        runMs = Date.now() - runStartedAt
                        return runResult
                    },
                })
                await manager.release(log)
                return { ...result, timings: { provisionMs, bootMs, runMs } }
            }
            catch (error) {
                await manager.invalidate(log)
                throw error
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
        async prewarm({ log, apiClient, publicApiUrl }: PreWarmSandboxParams): Promise<void> {
            if (isNil(apiClient) || isNil(publicApiUrl)) {
                return
            }
            const { error } = await tryCatch(async () => {
                const { flows, platformId, engineToken } = await apiClient.getPrewarmData({
                    workerGroupId: getSettings().WORKER_GROUP_ID,
                    projectWorker: getSettings().PROJECT_WORKER,
                })
                const resolver = createResolver({ apiClient, basePath, getSettings, log })
                const pieces: PiecePackage[] = []
                const codeSteps: CodeArtifact[] = []
                for (const flow of flows) {
                    const { data: resolved, error: flowError } = await tryCatch(() => resolver.resolve({ flow, platformId, publicApiUrl, engineToken }))
                    if (flowError) {
                        log.warn({ error: String(flowError), flow: { id: flow.id } }, 'Failed to resolve flow for prewarm')
                        continue
                    }
                    if (resolved.kind !== 'ready') {
                        continue
                    }
                    pieces.push(...resolved.provision.pieces)
                    codeSteps.push(...resolved.provision.codes)
                }
                await localExecutionCache(log, basePath, getSettings).provision({ pieces, codeSteps, publicApiUrl, engineToken })
                log.info({ flowCount: flows.length, pieceCount: pieces.length }, 'Prewarmed sandbox cache')
            })
            if (error) {
                log.warn({ error: String(error) }, 'Cache prewarm failed')
            }
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

}
