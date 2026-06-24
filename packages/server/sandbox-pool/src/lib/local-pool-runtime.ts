import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { RuntimeKind } from '@activepieces/shared'
import { localExecutionCache } from './cache/local-execution-cache'
import { ActiveSandboxInfo, createSandboxManager, SandboxManager } from './sandbox-manager'
import {
    ExecuteParams,
    ProvisionInput,
    Runtime,
    RuntimeExecutionResult,
    RuntimeExecutorInfo,
    SandboxPoolSettings,
} from './types'

export function createSandboxPool({ concurrency, basePath, getSettings, log: _log }: CreateLocalPoolRuntimeParams): Runtime {
    const managers: SandboxManager[] = Array.from({ length: concurrency }, (_, index) =>
        createSandboxManager({ boxId: index + 1, basePath, getSettings }),
    )
    // Slots are self-allocated: each execute grabs a free manager. Callers don't pin a worker index —
    // the host gates how many run at once (Cloud Run via maxInstanceRequestConcurrency, the worker via
    // its job concurrency), so a free slot always exists in steady state. Selection is synchronous, so
    // two concurrent executes never reserve the same manager.
    const reserved: boolean[] = new Array(concurrency).fill(false)
    // Provisioning writes the per-instance SHARED cache (pieces, compiled code, engine bundle). With
    // concurrency > 1 the first batch of executes for the same flow would race on the same files, so the
    // first provision per content key is deduplicated through a shared in-flight promise: the first call
    // does the work, everyone else awaits the same result. Once it resolves the key is cached, and later
    // executes skip provisioning entirely and run fully in parallel — no per-request serialization.
    const provisionByKey = new Map<string, Promise<void>>()

    return {
        kind: RuntimeKind.LOCAL,
        async execute({ log, operationType, operation, timeoutInSeconds, provision }: ExecuteParams): Promise<RuntimeExecutionResult> {
            const index = reserved.findIndex((isReserved) => !isReserved)
            if (index === -1) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: `No free sandbox slot (concurrency=${concurrency})` },
                })
            }
            reserved[index] = true
            const manager = managers[index]

            try {
                const sandbox = manager.acquire({ log })
                const key = provisionKey(provision)
                let provisionRun = provisionByKey.get(key)
                if (isNil(provisionRun)) {
                    provisionRun = localExecutionCache(log, basePath, getSettings).provision({
                        pieces: provision.pieces,
                        codeSteps: provision.codes,
                        publicApiUrl: provision.publicApiUrl,
                        engineToken: provision.engineToken,
                    })
                    provisionByKey.set(key, provisionRun)
                }
                const { error: provisionError } = await tryCatch(() => provisionRun)
                if (provisionError) {
                    // Drop the failed promise so the next execute retries provisioning.
                    provisionByKey.delete(key)
                    await manager.invalidate(log)
                    throw provisionError
                }

                try {
                    await sandbox.start({
                        flowVersionId: provision.flowVersionId,
                        platformId: provision.platformId,
                        mounts: [],
                    })
                    const result = await sandbox.execute(operationType, operation, { timeoutInSeconds })
                    await manager.release(log)
                    return result
                }
                catch (error) {
                    await manager.invalidate(log)
                    throw error
                }
            }
            finally {
                reserved[index] = false
            }
        },
        getActiveExecutors(): RuntimeExecutorInfo[] {
            return managers
                .map((manager) => manager.getActiveSandbox())
                .filter((info): info is ActiveSandboxInfo => !isNil(info))
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

// Identifies the cached content for a provision (pieces + compiled code steps). publicApiUrl/engineToken
// are how the cache is fetched, not what it contains, so they are excluded — two requests for the same
// flow share one provision regardless of token.
function provisionKey(provision: ProvisionInput): string {
    const pieces = provision.pieces.map((piece) => `${piece.pieceName}@${piece.pieceVersion}`).sort()
    const codes = provision.codes.map((code) => `${code.flowVersionId}/${code.name}`).sort()
    return JSON.stringify({ pieces, codes })
}

type CreateLocalPoolRuntimeParams = {
    concurrency: number
    basePath: string
    getSettings: () => SandboxPoolSettings
    log: ApLogger
}
