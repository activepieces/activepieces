import { isNil } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ApEnvironment, ExecutionMode, NetworkMode } from '@activepieces/shared'
import { createSandboxForJob, isIsolateMode } from './create-sandbox-for-job'
import { createEgressNetns, EgressNetns } from './sandbox/netns'
import { EgressInfo, Sandbox, SandboxLogger } from './sandbox/types'
import { SandboxSettings } from './types'

export function createSandboxManager({ boxId, basePath, getSettings }: { boxId: number, basePath: string, getSettings: () => SandboxSettings }): SandboxManager {
    let currentSandbox: Sandbox | null = null
    // The egress netns is a per-box resource created once (lazily, on the first isolate+STRICT start)
    // and reused across jobs — it must outlive the per-job sandbox churn (untrusted modes rebuild the
    // sandbox every job), so it is owned here and only torn down on manager shutdown.
    let egress: EgressNetns | null = null
    let egressPromise: Promise<EgressNetns> | null = null

    async function getEgress(log: SandboxLogger): Promise<EgressInfo | null> {
        const settings = getSettings()
        const strictIsolate = isIsolateMode(settings.EXECUTION_MODE as ExecutionMode) && settings.NETWORK_MODE === NetworkMode.STRICT
        if (!strictIsolate) {
            return null
        }
        if (isNil(egressPromise)) {
            egressPromise = createEgressNetns({ log, boxId })
                .then((handle) => {
                    egress = handle
                    return handle
                })
                .catch((err) => {
                    egressPromise = null
                    throw err
                })
        }
        const handle = await egressPromise
        return { netnsName: handle.netnsName, gatewayHost: handle.gatewayHost }
    }

    async function teardownEgress(log: ApLogger): Promise<void> {
        if (!isNil(egress)) {
            await egress.destroy()
            egress = null
            egressPromise = null
            log.info({ boxId }, 'Egress network namespace destroyed')
        }
    }

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
            currentSandbox = createSandboxForJob({ ...params, boxId, reusable: canReuseSandbox(getSettings), basePath, getSettings, getEgress })
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
            await teardownEgress(log)
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
}

export type SandboxManager = {
    acquire(params: { log: ApLogger }): Sandbox
    invalidate(log: ApLogger): Promise<void>
    release(log: ApLogger): Promise<void>
    shutdown(log: ApLogger): Promise<void>
    getActiveSandbox(): ActiveSandboxInfo | null
}
