import { ApEnvironment, ExecutionMode, isNil, WorkerToApiContract } from '@activepieces/shared'
import { Logger } from 'pino'
import { system, WorkerSystemProp } from '../config/configs'
import { workerSettings } from '../config/worker-settings'
import { Sandbox } from '../sandbox/types'
import { createSandboxForJob } from './create-sandbox-for-job'

function canReuseSandbox(): boolean {
    const workerGroupId = system.get(WorkerSystemProp.WORKER_GROUP_ID)
    if (!isNil(workerGroupId)) {
        return system.get(WorkerSystemProp.REUSE_SANDBOX) === 'true'
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

export function createSandboxManager(boxId: number): SandboxManager {
    let currentSandbox: Sandbox | null = null

    return {
        acquire(params: { log: Logger, apiClient: WorkerToApiContract }): Sandbox {
            if (canReuseSandbox() && currentSandbox && currentSandbox.isReady()) {
                return currentSandbox
            }
            if (currentSandbox) {
                params.log.info('Sandbox not ready or not reusable, creating fresh one')
                currentSandbox.shutdown().catch((err) =>
                    params.log.error({ err }, 'Error shutting down previous sandbox'),
                )
            }
            currentSandbox = createSandboxForJob({ ...params, boxId })
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
        async release(log: Logger): Promise<void> {
            if (!canReuseSandbox()) {
                await this.invalidate(log)
            }
        },
        async shutdown(log: Logger): Promise<void> {
            await this.invalidate(log)
        },
    }
}

export type SandboxManager = {
    acquire(params: { log: Logger, apiClient: WorkerToApiContract }): Sandbox
    invalidate(log: Logger): Promise<void>
    release(log: Logger): Promise<void>
    shutdown(log: Logger): Promise<void>
}
