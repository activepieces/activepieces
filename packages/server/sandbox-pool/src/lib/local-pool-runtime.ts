import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { RuntimeKind } from '@activepieces/shared'
import { localExecutionCache } from './cache/local-execution-cache'
import { ActiveSandboxInfo, createSandboxManager, SandboxManager } from './sandbox-manager'
import {
    ExecuteParams,
    Runtime,
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
        async execute({ workerIndex, log, operationType, operation, timeoutInSeconds, provision }: ExecuteParams): Promise<RuntimeExecutionResult> {
            const manager = managers[workerIndex]
            if (isNil(manager)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: `No sandbox manager for worker index ${workerIndex} (concurrency=${concurrency})` },
                })
            }

            const sandbox = manager.acquire({ log })
            const { error: provisionError } = await tryCatch(() =>
                localExecutionCache(log, basePath, getSettings).provision({
                    pieces: provision.pieces,
                    codeSteps: provision.codes,
                    fetchArchive: provision.fetchArchive,
                }),
            )
            if (provisionError) {
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

type CreateLocalPoolRuntimeParams = {
    concurrency: number
    basePath: string
    getSettings: () => SandboxPoolSettings
    log: ApLogger
}
