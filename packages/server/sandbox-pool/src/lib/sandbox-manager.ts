import { isNil } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ApEnvironment, ExecutionMode } from '@activepieces/shared'
import { createSandboxForJob } from './create-sandbox-for-job'
import { Sandbox } from './sandbox/types'
import { SandboxPoolSettings } from './types'

export function createSandboxManager({ boxId, basePath, getSettings }: { boxId: number, basePath: string, getSettings: () => SandboxPoolSettings }): SandboxManager {
    let currentSandbox: Sandbox | null = null

    return {
        acquire(params: { log: ApLogger }): Sandbox {
            if (canReuseSandbox(getSettings) && currentSandbox && currentSandbox.isReady()) {
                return currentSandbox
            }
            if (currentSandbox) {
                params.log.info('Sandbox not ready or not reusable, creating fresh one')
                currentSandbox.shutdown().catch((err) =>
                    params.log.error({ error: err }, 'Error shutting down previous sandbox'),
                )
            }
            currentSandbox = createSandboxForJob({ ...params, boxId, reusable: canReuseSandbox(getSettings), basePath, getSettings })
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
            return {
                sandboxId: currentSandbox.id,
                boxId,
                pid,
                busy: currentSandbox.isBusy(),
            }
        },
    }
}

function canReuseSandbox(getSettings: () => SandboxPoolSettings): boolean {
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
}

export type SandboxManager = {
    acquire(params: { log: ApLogger }): Sandbox
    invalidate(log: ApLogger): Promise<void>
    release(log: ApLogger): Promise<void>
    shutdown(log: ApLogger): Promise<void>
    getActiveSandbox(): ActiveSandboxInfo | null
}
