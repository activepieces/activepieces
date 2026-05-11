import { ApEnvironment, ExecutionMode, isNil, WorkerToApiContract } from '@activepieces/shared'
import { Logger } from 'pino'
import { system, WorkerSystemProp } from '../config/configs'
import { workerSettings } from '../config/worker-settings'
import { Sandbox } from '../sandbox/types'
import { createSandboxForJob } from './create-sandbox-for-job'

export function createSandboxManager({ boxId, proxyPort }: { boxId: number, proxyPort: number | null }): SandboxManager {
    let currentSandbox: Sandbox | null = null

    return {
        acquire(params: AcquireParams): Sandbox {
            const needsFresh = params.requiresFreshSandbox === true

            if (!needsFresh && canReuseSandbox() && currentSandbox && currentSandbox.isReady()) {
                return currentSandbox
            }
            if (currentSandbox) {
                params.log.info(
                    { needsFresh },
                    needsFresh
                        ? 'Piece requires fresh sandbox; invalidating current and spawning new'
                        : 'Sandbox not ready or not reusable, creating fresh one',
                )
                currentSandbox.shutdown().catch((err) =>
                    params.log.error({ err }, 'Error shutting down previous sandbox'),
                )
            }
            const reusable = canReuseSandbox() && !needsFresh
            currentSandbox = createSandboxForJob({ ...params, boxId, reusable, proxyPort })
            return currentSandbox
        },
        async invalidate(log: Logger): Promise<void> {
            if (currentSandbox) {
                log.info('Invalidating sandbox')
                const sb = currentSandbox
                currentSandbox = null
                await sb.shutdown()
            }
        },
        async release(log: Logger, opts?: ReleaseOptions): Promise<void> {
            if (!canReuseSandbox() || opts?.invalidateAfter === true) {
                await this.invalidate(log)
            }
        },
        async shutdown(log: Logger): Promise<void> {
            await this.invalidate(log)
        },
    }
}

function canReuseSandbox(): boolean {
    const reuseSandbox = system.get(WorkerSystemProp.REUSE_SANDBOX)
    if (!isNil(reuseSandbox)) {
        return reuseSandbox === 'true'
    }
    const settings = workerSettings.getSettings()
    if (settings.ENVIRONMENT === ApEnvironment.DEVELOPMENT) {
        return true
    }
    const trustedModes = [ExecutionMode.SANDBOX_CODE_ONLY, ExecutionMode.UNSANDBOXED]
    if (trustedModes.includes(settings.EXECUTION_MODE as ExecutionMode)) {
        return true
    }
    return false
}

type AcquireParams = {
    log: Logger
    apiClient: WorkerToApiContract
    requiresFreshSandbox?: boolean
}

type ReleaseOptions = {
    invalidateAfter?: boolean
}

export type SandboxManager = {
    acquire(params: AcquireParams): Sandbox
    invalidate(log: Logger): Promise<void>
    release(log: Logger, opts?: ReleaseOptions): Promise<void>
    shutdown(log: Logger): Promise<void>
}
