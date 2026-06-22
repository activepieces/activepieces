import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowVersion, RuntimeKind, WorkerToApiContract } from '@activepieces/shared'
import { resolveFlowArtifacts } from './cache/flow/flow-artifacts'
import { flowCache } from './cache/flow/flow-cache'
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

            if (!isNil(input.flow)) {
                // Resolve FIRST, acquire LATER — no sandbox slot consumed for a missing/disabled flow.
                const fetched = await flowCache(log, apiClient, basePath).getVersion({ flowVersionId: input.flow.versionId })
                if (isNil(fetched)) {
                    return { kind: 'flow-not-found' }
                }
                flowVersion = fetched

                const artifacts = await resolveFlowArtifacts({
                    flowVersion,
                    platformId: input.platformId,
                    flowId: input.flow.id,
                    projectId: input.flow.projectId,
                    log,
                    apiClient,
                    basePath,
                    getSettings,
                })
                if (artifacts.disabled) {
                    return { kind: 'disabled' }
                }

                pieces = [...pieces, ...artifacts.pieces]
                codes = [...codes, ...artifacts.codeSteps]
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
