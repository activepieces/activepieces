import { type ApLogger } from '@activepieces/server-utils'
import { ApEnvironment, ExecutionMode, isNil } from '@activepieces/shared'
import { system, WorkerSystemProp } from '../../../config/configs'
import { workerSettings } from '../../../config/worker-settings'
import { getActiveProxyPort } from '../../../egress/lifecycle'
import { provisionLocalCache } from '../provision-cache'
import { Sandbox } from '../sandbox-contract'
import { ActiveSandboxInfo, FlowExecutionRuntime } from '../types'
import { createSandboxForJob } from './create-sandbox-for-job'

export function createWorkerPoolRuntime({ boxId }: { boxId: number }): FlowExecutionRuntime {
    let currentSandbox: Sandbox | null = null
    const proxyPort = getActiveProxyPort()

    const acquire = (log: ApLogger): Sandbox => {
        if (canReuseSandbox() && currentSandbox && currentSandbox.isReady()) {
            return currentSandbox
        }
        if (currentSandbox) {
            log.info('Sandbox not ready or not reusable, creating fresh one')
            currentSandbox.shutdown().catch((err) =>
                log.error({ err }, 'Error shutting down previous sandbox'),
            )
        }
        currentSandbox = createSandboxForJob({ log, boxId, reusable: canReuseSandbox(), proxyPort })
        return currentSandbox
    }

    const invalidate = async (log: ApLogger): Promise<void> => {
        if (currentSandbox) {
            log.info('Invalidating sandbox')
            const sb = currentSandbox
            currentSandbox = null
            await sb.shutdown()
        }
    }

    return {
        async ready({ operation, log, apiClient }): Promise<Sandbox> {
            await provisionLocalCache({ operation, log, apiClient })

            const sandbox = acquire(log)
            try {
                await sandbox.start({
                    flowVersionId: operation.kind === 'FLOW' ? operation.flowVersion.id : undefined,
                    platformId: operation.platformId,
                    mounts: [],
                })
            }
            catch (e) {
                await invalidate(log)
                throw e
            }
            return sandbox
        },
        invalidate,
        async release(log: ApLogger): Promise<void> {
            if (!canReuseSandbox()) {
                await invalidate(log)
            }
        },
        async shutdown(log: ApLogger): Promise<void> {
            await invalidate(log)
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
