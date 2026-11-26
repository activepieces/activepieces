import { isNil } from '@activepieces/core-utils'
import { type ApLogger, systemUsage } from '@activepieces/server-utils'
import { ApEnvironment, ExecutionMode, SandboxMemoryUsage } from '@activepieces/shared'
import { createSandboxForJob } from './create-sandbox-for-job'
import { Sandbox } from './sandbox/types'
import { SandboxSettings } from './types'

const BYTES_PER_KB = 1024

let devPiecesGeneration = 0

export function markDevPiecesRebuilt(): void {
    devPiecesGeneration++
}

export function createSandboxManager({ boxId, basePath, getSettings }: { boxId: number, basePath: string, getSettings: () => SandboxSettings }): SandboxManager {
    let currentSandbox: Sandbox | null = null
    let currentSandboxDevPiecesGeneration = devPiecesGeneration

    return {
        async acquire(params: { log: ApLogger }): Promise<Sandbox> {
            const builtBeforeDevPiecesRebuild = currentSandboxDevPiecesGeneration < devPiecesGeneration
            const reusableSandbox = canReuseSandbox(getSettings) && currentSandbox && currentSandbox.isReady() && !builtBeforeDevPiecesRebuild ? currentSandbox : null
            const reachedRecycleThreshold = !isNil(reusableSandbox) && await hasReachedRecycleThreshold({ sandbox: reusableSandbox, settings: getSettings() })
            if (!isNil(reusableSandbox) && !reachedRecycleThreshold) {
                return reusableSandbox
            }
            if (currentSandbox) {
                params.log.info({ sandbox: { id: currentSandbox.id } }, replaceReason({ reachedRecycleThreshold, builtBeforeDevPiecesRebuild }))
                currentSandbox.shutdown().catch((err) =>
                    params.log.error({ error: err }, 'Error shutting down previous sandbox'),
                )
            }
            currentSandbox = createSandboxForJob({ ...params, boxId, reusable: canReuseSandbox(getSettings), basePath, getSettings })
            currentSandboxDevPiecesGeneration = devPiecesGeneration
            return currentSandbox
        },
        async invalidate(log: ApLogger): Promise<void> {
            if (currentSandbox) {
                log.info('Invalidating sandbox')
                const sb = currentSandbox
                currentSandbox = null
                await sb.shutdown()
            }
        },
        async release(log: ApLogger): Promise<void> {
            if (!canReuseSandbox(getSettings)) {
                await this.invalidate(log)
            }
        },
        async shutdown(log: ApLogger): Promise<void> {
            await this.invalidate(log)
        },
        getActiveSandbox(): ActiveSandboxInfo | null {
            if (isNil(currentSandbox) || !currentSandbox.isReady()) {
                return null
            }
            const pid = currentSandbox.getPid()
            if (isNil(pid)) {
                return null
            }
            const sandbox = currentSandbox
            return {
                sandboxId: sandbox.id,
                boxId,
                pid,
                busy: sandbox.isBusy(),
                getMemoryUsage: () => sandbox.getMemoryUsage(),
            }
        },
    }
}

async function hasReachedRecycleThreshold({ sandbox, settings }: { sandbox: Sandbox, settings: SandboxSettings }): Promise<boolean> {
    const thresholdPercent = Number(settings.RECYCLE_SANDBOX_AT)
    const memoryLimitKb = Number(settings.SANDBOX_MEMORY_LIMIT)
    const pid = sandbox.getPid()
    if (isNil(settings.RECYCLE_SANDBOX_AT) || isNil(pid) || !(thresholdPercent > 0) || !(memoryLimitKb > 0)) {
        return false
    }
    const memoryByPid = await systemUsage.getProcessTreeMemoryBytesByPids([pid])
    return (memoryByPid.get(pid) ?? 0) >= memoryLimitKb * BYTES_PER_KB * thresholdPercent / 100
}

function replaceReason({ reachedRecycleThreshold, builtBeforeDevPiecesRebuild }: { reachedRecycleThreshold: boolean, builtBeforeDevPiecesRebuild: boolean }): string {
    if (reachedRecycleThreshold) {
        return 'Sandbox memory reached AP_RECYCLE_SANDBOX_AT, replacing it with a fresh one'
    }
    return builtBeforeDevPiecesRebuild ? 'Dev pieces were rebuilt, replacing stale sandbox' : 'Sandbox not ready or not reusable, creating fresh one'
}

function canReuseSandbox(getSettings: () => SandboxSettings): boolean {
    const settings = getSettings()
    if (!isNil(settings.REUSE_SANDBOX)) {
        return settings.REUSE_SANDBOX === 'true'
    }
    if (settings.ENVIRONMENT === ApEnvironment.DEVELOPMENT) {
        return true
    }
    const trustedModes = [ExecutionMode.SANDBOX_CODE_ONLY, ExecutionMode.UNSANDBOXED]
    if (trustedModes.includes(settings.EXECUTION_MODE as ExecutionMode)) {
        return true
    }
    return false
}

export type ActiveSandboxInfo = {
    sandboxId: string
    boxId: number
    pid: number
    busy: boolean
    getMemoryUsage: () => Promise<SandboxMemoryUsage | null>
}

export type SandboxManager = {
    acquire(params: { log: ApLogger }): Promise<Sandbox>
    invalidate(log: ApLogger): Promise<void>
    release(log: ApLogger): Promise<void>
    shutdown(log: ApLogger): Promise<void>
    getActiveSandbox(): ActiveSandboxInfo | null
}
