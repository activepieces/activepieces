import { type ApLogger } from '@activepieces/server-utils'
import { ActivepiecesError, ErrorCode, isNil, RuntimeKind, WorkerToApiContract } from '@activepieces/shared'
import { localCacheInstall } from '../provision/piece-install-strategy'
import {
    CreateExecutionParams,
    DisposeParams,
    InitParams,
    ProvisionParams,
    RunParams,
    Runtime,
    RuntimeExecution,
    RuntimeExecutionResult,
    RuntimeExecutorInfo,
} from '../types'
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
    let mountContext: InitParams | null = null

    return {
        init(params: InitParams): Promise<void> {
            // Acquire the lane's (possibly reused) sandbox object but do NOT start the process yet —
            // the spawn happens in run(), after provision() has populated the mounted cache.
            sandbox = manager.acquire({ log, apiClient })
            mountContext = params
            return Promise.resolve()
        },
        provision({ pieces, codeSteps }: ProvisionParams): Promise<void> {
            // Host-side install into the local cache that the sandbox bind-mounts. The locked engine
            // sandbox never runs bun itself.
            return localCacheInstall({ log, apiClient }).install({ pieces, codeSteps })
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
