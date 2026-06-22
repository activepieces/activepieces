import { type ApLogger } from '@activepieces/server-utils'
import { ActivepiecesError, ErrorCode, isNil, RuntimeKind, tryCatch, WorkerToApiContract } from '@activepieces/shared'
import {
    CreateExecutionParams,
    DisposeParams,
    InitParams,
    RunParams,
    Runtime,
    RuntimeExecution,
    RuntimeExecutionResult,
    RuntimeExecutorInfo,
} from '../types'
import { localExecutionCache } from './cache/local-execution-cache'
import { Sandbox } from './sandbox/types'
import { ActiveSandboxInfo, createSandboxManager, SandboxManager } from './sandbox-manager'

export function createWorkerPoolRuntime({ concurrency, proxyPort }: CreateWorkerPoolRuntimeParams): Runtime {
    const managers: SandboxManager[] = Array.from({ length: concurrency }, (_, index) =>
        createSandboxManager({ boxId: index + 1, proxyPort }),
    )

    return {
        kind: RuntimeKind.WORKER_POOL,
        createExecution({ workerIndex, log, apiClient }: CreateExecutionParams): RuntimeExecution {
            const manager = managers[workerIndex]
            if (isNil(manager)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: `No sandbox manager for worker index ${workerIndex} (concurrency=${concurrency})` },
                })
            }
            return createWorkerPoolExecution({ manager, log, apiClient })
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
        async shutdown(log: ApLogger): Promise<void> {
            await Promise.all(managers.map((manager) => manager.shutdown(log)))
        },
    }
}

function createWorkerPoolExecution({ manager, log, apiClient }: CreateWorkerPoolExecutionParams): RuntimeExecution {
    let sandbox: Sandbox | null = null
    let mountContext: MountContext | null = null

    return {
        async init({ flowVersionId, platformId, pieces, codeSteps }: InitParams): Promise<void> {
            // Acquire the lane's (possibly reused) sandbox object but do NOT start the process yet —
            // the spawn happens in run(), after the host-side install below populates the cache the
            // sandbox bind-mounts (the locked engine sandbox never runs bun itself).
            sandbox = manager.acquire({ log, apiClient })
            mountContext = { flowVersionId, platformId }
            // Install host-side (NOT inside the locked engine sandbox) into the persistent local
            // cache that the sandbox bind-mounts — the locked engine never runs bun itself. The
            // serverless runtime is the engine-side counterpart: it self-installs bundled .tgz
            // pieces inside the function (see the GCP runtime stub), so it does not go through here.
            // Keep init atomic: if the install fails, release the lane we just took so callers
            // (which only guard run()) never leak the slot.
            const { error } = await tryCatch(() => localExecutionCache(log, apiClient).provision({ pieces, codeSteps }))
            if (error) {
                await manager.invalidate(log)
                sandbox = null
                mountContext = null
                throw error
            }
        },
        async run({ operationType, operation, timeoutInSeconds }: RunParams): Promise<RuntimeExecutionResult> {
            if (isNil(sandbox) || isNil(mountContext)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: 'Runtime execution run() called before init()' },
                })
            }
            await sandbox.start({
                flowVersionId: mountContext.flowVersionId,
                platformId: mountContext.platformId,
                mounts: [],
            })
            return sandbox.execute(operationType, operation, { timeoutInSeconds })
        },
        dispose({ invalidate }: DisposeParams): Promise<void> {
            return invalidate ? manager.invalidate(log) : manager.release(log)
        },
    }
}

type CreateWorkerPoolRuntimeParams = {
    concurrency: number
    proxyPort: number | null
}

type CreateWorkerPoolExecutionParams = {
    manager: SandboxManager
    log: ApLogger
    apiClient: WorkerToApiContract
}

type MountContext = {
    flowVersionId: string | undefined
    platformId: string
}
