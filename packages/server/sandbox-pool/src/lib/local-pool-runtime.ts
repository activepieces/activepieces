import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowVersion, PiecePackage, RuntimeKind, WorkerToApiContract } from '@activepieces/shared'
import { flowProvisioning } from './cache/flow/flow-provisioning'
import { localExecutionCache } from './cache/local-execution-cache'
import { Sandbox } from './sandbox/types'
import { ActiveSandboxInfo, createSandboxManager, SandboxManager } from './sandbox-manager'
import {
    CreateExecutionParams,
    DisposeParams,
    ProvisionInput,
    ProvisionResult,
    RunParams,
    Runtime,
    RuntimeExecution,
    RuntimeExecutionResult,
    RuntimeExecutorInfo,
    SandboxPoolSettings,
} from './types'

export function createSandboxPool({ concurrency, basePath, getSettings, log: _log }: CreateLocalPoolRuntimeParams): Runtime {
    const managers: SandboxManager[] = Array.from({ length: concurrency }, (_, index) =>
        createSandboxManager({ boxId: index + 1, basePath, getSettings }),
    )

    return {
        kind: RuntimeKind.LOCAL,
        createExecution({ workerIndex, log: execLog, apiClient }: CreateExecutionParams): RuntimeExecution {
            const manager = managers[workerIndex]
            if (isNil(manager)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: `No sandbox manager for worker index ${workerIndex} (concurrency=${concurrency})` },
                })
            }
            return createLocalPoolExecution({ manager, log: execLog, apiClient, basePath, getSettings })
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

function createLocalPoolExecution({ manager, log, apiClient, basePath, getSettings }: CreateLocalPoolExecutionParams): RuntimeExecution {
    let sandbox: Sandbox | null = null
    let mountContext: MountContext | null = null

    return {
        async provision(input: ProvisionInput): Promise<ProvisionResult> {
            let pieces = input.pieces ?? []
            let codes = input.codes ?? []
            let flowVersion: FlowVersion | undefined
            let pendingPublish: { flowVersion: FlowVersion, pieces: PiecePackage[] } | null = null

            if (!isNil(input.flow)) {
                // Resolve FIRST, acquire LATER — no sandbox slot consumed for a missing/disabled flow.
                // The Flow Provisioning module hides the bundle hit vs. fetch-resolve-and-publish decision.
                const resolved = await flowProvisioning(log, apiClient, basePath, getSettings).resolve({ flow: input.flow, platformId: input.platformId })
                if (resolved.kind === 'flow-not-found') {
                    return { kind: 'flow-not-found' }
                }
                if (resolved.kind === 'disabled') {
                    return { kind: 'disabled' }
                }
                flowVersion = resolved.flowVersion
                pieces = [...pieces, ...resolved.pieces]
                codes = [...codes, ...resolved.codeSteps]
                if (resolved.needsPublish) {
                    pendingPublish = { flowVersion: resolved.flowVersion, pieces: resolved.pieces }
                }
            }

            sandbox = manager.acquire({ log, apiClient })
            mountContext = { flowVersionId: flowVersion?.id, platformId: input.platformId }
            const { error } = await tryCatch(() =>
                localExecutionCache(log, apiClient, basePath, getSettings).provision({ pieces, codeSteps: codes }),
            )
            if (error) {
                await manager.invalidate(log)
                sandbox = null
                mountContext = null
                throw error
            }

            if (!isNil(pendingPublish) && !isNil(input.flow)) {
                // Best-effort: build once, share via the store. A failed upload never fails the run.
                void flowProvisioning(log, apiClient, basePath, getSettings).publishBundle({
                    flowVersion: pendingPublish.flowVersion,
                    pieces: pendingPublish.pieces,
                    projectId: input.flow.projectId,
                    platformId: input.platformId,
                })
            }
            return { kind: 'ready', flowVersion }
        },
        async run({ operationType, operation, timeoutInSeconds }: RunParams): Promise<RuntimeExecutionResult> {
            if (isNil(sandbox) || isNil(mountContext)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: 'Runtime execution run() called before provision()' },
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

type CreateLocalPoolRuntimeParams = {
    concurrency: number
    basePath: string
    getSettings: () => SandboxPoolSettings
    log: ApLogger
}

type CreateLocalPoolExecutionParams = {
    manager: SandboxManager
    log: ApLogger
    apiClient: WorkerToApiContract
    basePath: string
    getSettings: () => SandboxPoolSettings
}

type MountContext = {
    flowVersionId: string | undefined
    platformId: string
}
