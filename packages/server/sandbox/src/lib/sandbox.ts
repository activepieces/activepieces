import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, apVersionUtil, wideEvent } from '@activepieces/server-utils'
import { PrewarmScopeFileContent, WorkerToApiContract } from '@activepieces/shared'
import { localExecutionCache } from './cache/local-execution-cache'
import { createResolver } from './resolver'
import { createSandboxManager, SandboxManager } from './sandbox-manager'
import {
    ExecuteParams,
    PreWarmSandboxParams,
    ProvisionInput,
    Resolver,
    Runtime,
    RuntimeExecutionResult,
    RuntimeExecutorInfo,
    SandboxSettings,
} from './types'
import { bundleHttp } from './utils/bundle-http'

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
        async execute({ workerIndex, log, operationType, operation, timeoutInSeconds, expiresAt, provision }: ExecuteParams): Promise<RuntimeExecutionResult> {
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
                        const runTimeoutInSeconds = remainingTimeoutInSeconds({ timeoutInSeconds, expiresAt })
                        if (runTimeoutInSeconds <= 0) {
                            throw new ActivepiecesError({
                                code: ErrorCode.SANDBOX_EXECUTION_TIMEOUT,
                                params: {
                                    standardOutput: '',
                                    standardError: `Caller deadline passed while starting the sandbox (provisionMs=${provisionMs}, bootMs=${bootMs}), the operation was never started`,
                                    neverStarted: true,
                                },
                            })
                        }
                        const runStartedAt = Date.now()
                        const runResult = await wideEvent.timed({
                            name: 'sandboxRun',
                            fn: () => sandbox.execute(operationType, operation, { timeoutInSeconds: runTimeoutInSeconds }),
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
        async prewarm({ log, apiClient, publicApiUrl, flow }: PreWarmSandboxParams): Promise<void> {
            if (isNil(apiClient) || isNil(publicApiUrl)) {
                return
            }
            const startedAt = Date.now()
            const { error } = await tryCatch(async () => {
                const prewarmData = await apiClient.getPrewarmData({
                    workerGroupId: getSettings().WORKER_GROUP_ID,
                    projectWorker: getSettings().PROJECT_WORKER,
                    workerVersion: apVersionUtil.getCurrentRelease(),
                    flow,
                })
                const { platformId, engineToken } = prewarmData
                // Platform-wide prewarm uses the distinct piece/code set the app computed in one pass.
                // The targeted (flowPublished) prewarm still resolves worker-side, which also publishes
                // the flow bundle.
                const { pieces, codeSteps } = isNil(flow)
                    ? await fetchScopeFile({ apiClient, scopeFileId: prewarmData.scopeFileId })
                    : await resolveFlowsForPrewarm({
                        resolver: createResolver({ apiClient, basePath, getSettings, log }),
                        flows: prewarmData.flows ?? [],
                        platformId,
                        publicApiUrl,
                        engineToken,
                        log,
                    })
                await localExecutionCache(log, basePath, getSettings).provision({ pieces, codeSteps, publicApiUrl, engineToken })
                log.info({ pieceCount: pieces.length, codeStepCount: codeSteps.length, durationMs: Date.now() - startedAt }, 'Prewarmed sandbox cache')
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

async function fetchScopeFile({ apiClient, scopeFileId }: FetchScopeFileParams): Promise<ResolvedPrewarmInputs> {
    if (isNil(scopeFileId)) {
        return { pieces: [], codeSteps: [] }
    }
    const response = await apiClient.getPrewarmScopeFile({ fileId: scopeFileId })
    if (isNil(response)) {
        return { pieces: [], codeSteps: [] }
    }
    const data = response.kind === 'url' ? await bundleHttp.getBuffer(response.url) : response.data
    const content = JSON.parse(data.toString('utf8')) as PrewarmScopeFileContent
    return { pieces: content.pieces, codeSteps: content.codes }
}

async function resolveFlowsForPrewarm({ resolver, flows, platformId, publicApiUrl, engineToken, log }: ResolveFlowsForPrewarmParams): Promise<ResolvedPrewarmInputs> {
    const resolvedFlows = await Promise.all(flows.map(async (flow) => {
        const { data: resolved, error: flowError } = await tryCatch(() => resolver.resolve({ flow, platformId, publicApiUrl, engineToken }))
        if (flowError) {
            log.warn({ error: String(flowError), flow: { id: flow.id } }, 'Failed to resolve flow for prewarm')
            return null
        }
        return resolved.kind === 'ready' ? resolved.provision : null
    }))
    const provisions = resolvedFlows.filter((provision) => !isNil(provision))
    return {
        pieces: provisions.flatMap((provision) => provision.pieces),
        codeSteps: provisions.flatMap((provision) => provision.codes),
    }
}


function remainingTimeoutInSeconds({ timeoutInSeconds, expiresAt }: { timeoutInSeconds: number, expiresAt?: number }): number {
    if (isNil(expiresAt)) {
        return timeoutInSeconds
    }
    return Math.min(timeoutInSeconds, Math.floor((expiresAt - Date.now()) / 1000))
}

type FetchScopeFileParams = {
    apiClient: WorkerToApiContract
    scopeFileId: string | undefined
}

type ResolveFlowsForPrewarmParams = {
    resolver: Resolver
    flows: { id: string, versionId: string, projectId: string }[]
    platformId: string
    publicApiUrl: string
    engineToken: string
    log: ApLogger
}

type ResolvedPrewarmInputs = {
    pieces: ProvisionInput['pieces']
    codeSteps: ProvisionInput['codes']
}

type CreateSandboxRuntimeParams = {
    concurrency?: number
    basePath: string
    getSettings: () => SandboxSettings

}
