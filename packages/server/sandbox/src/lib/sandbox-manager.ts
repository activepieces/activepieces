import { isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ApEnvironment, ExecutionMode, NetworkMode } from '@activepieces/shared'
import { createSandboxForJob, isIsolateMode } from './create-sandbox-for-job'
import { type ApiEgressResolution, createEgressNetns, EgressNetns, resolveApiEgressCached } from './sandbox/netns'
import { EgressInfo, Sandbox, SandboxLogger, SandboxStartOptions } from './sandbox/types'
import { SandboxSettings } from './types'

export function createSandboxManager({ boxId, basePath, getSettings, internalApiUrl }: { boxId: number, basePath: string, getSettings: () => SandboxSettings, internalApiUrl?: string }): SandboxManager {
    let currentSandbox: Sandbox | null = null
    let currentStart: Promise<void> | null = null
    let egressPromise: Promise<EgressNetns> | null = null
    let egressCacheKey: string | null = null
    let lastEgressRotationAt = 0
    let consecutiveEgressFailures = 0
    let egressProbeAt = 0
    let pendingEgressResolution: Promise<void> | null = null

    // Resolves ONCE and keys off that same answer, so the key always describes the rules installed.
    async function resolveEgressState(log: SandboxLogger): Promise<{ cacheKey: string, apiEgress: ApiEgressResolution }> {
        const settings = getSettings()
        const apiEgress = await resolveApiEgressCached({ internalApiUrl, log })
        return {
            cacheKey: `${normalizeAllowListKey(settings.SSRF_ALLOW_LIST)}|${apiEgress.fingerprint}`,
            apiEgress,
        }
    }

    async function egressNeedsRotation(log: SandboxLogger): Promise<boolean> {
        const settings = getSettings()
        const strictIsolate = isIsolateMode(settings.EXECUTION_MODE as ExecutionMode) && settings.NETWORK_MODE === NetworkMode.STRICT
        if (!strictIsolate || isNil(egressCacheKey)) {
            return false
        }
        // Each rotation tears down the netns and kills the child, so a flapping resolver is rate-limited.
        if (Date.now() - lastEgressRotationAt < MIN_EGRESS_ROTATION_INTERVAL_MS) {
            return false
        }
        const { cacheKey } = await resolveEgressState(log)
        return egressCacheKey !== cacheKey
    }

    // The ONLY writer of the counter, and the gate returns before this, so the deadline alone unlatches it.
    async function getEgress(log: SandboxLogger): Promise<EgressInfo | null> {
        // Published for shutdown: egressPromise lands after the resolution, so a racing shutdown would leak it.
        const pending = resolveBoxEgress(log)
        pendingEgressResolution = pending.then(() => undefined, () => undefined)
        const { data, error } = await tryCatch(() => pending)
        if (error) {
            consecutiveEgressFailures++
            egressProbeAt = Date.now() + EGRESS_PROBE_INTERVAL_MS
            log.error(
                { boxId, consecutiveEgressFailures, error: String(error) },
                'Egress setup failed for this box',
            )
            throw error
        }
        consecutiveEgressFailures = 0
        egressProbeAt = 0
        return data ?? null
    }

    async function resolveBoxEgress(log: SandboxLogger): Promise<EgressInfo | null> {
        const settings = getSettings()
        const strictIsolate = isIsolateMode(settings.EXECUTION_MODE as ExecutionMode) && settings.NETWORK_MODE === NetworkMode.STRICT
        if (!strictIsolate) {
            return null
        }
        // A failed resolution changes nothing, so the built namespace is still correct; a first boot has none.
        const { data: state, error: resolveError } = await tryCatch(() => resolveEgressState(log))
        if (isNil(state)) {
            const cached = egressPromise
            if (isNil(cached)) {
                throw resolveError
            }
            const { data: handle } = await tryCatch(() => cached)
            if (isNil(handle)) {
                throw resolveError
            }
            log.warn(
                { boxId, error: String(resolveError) },
                'Could not re-resolve the app API address; reusing the existing egress namespace unchanged',
            )
            return toEgressInfo(handle)
        }
        const { cacheKey, apiEgress } = state
        if (!isNil(egressPromise) && egressCacheKey !== cacheKey) {
            const pending = egressPromise
            egressPromise = null
            egressCacheKey = null
            lastEgressRotationAt = Date.now()
            const { data: handle } = await tryCatch(() => pending)
            if (!isNil(handle)) {
                await handle.destroy()
            }
        }
        if (isNil(egressPromise)) {
            egressCacheKey = cacheKey
            egressPromise = createEgressNetns({ log, boxId, internalApiUrl, allowList: settings.SSRF_ALLOW_LIST, apiEgress })
                .catch((err) => {
                    egressPromise = null
                    egressCacheKey = null
                    throw err
                })
        }
        return toEgressInfo(await egressPromise)
    }

    async function teardownEgress(log: ApLogger): Promise<void> {
        if (isNil(egressPromise)) {
            return
        }
        const pending = egressPromise
        egressPromise = null
        egressCacheKey = null
        const { data: handle, error } = await tryCatch(() => pending)
        if (!isNil(error) || isNil(handle)) {
            return
        }
        await handle.destroy()
        log.info({ boxId }, 'Egress network namespace destroyed')
    }

    function trackStart(sandbox: Sandbox): Sandbox {
        return {
            ...sandbox,
            start: (startOptions: SandboxStartOptions) => {
                const pending = sandbox.start(startOptions)
                currentStart = pending
                void pending.catch(() => undefined).finally(() => {
                    if (currentStart === pending) {
                        currentStart = null
                    }
                })
                return pending
            },
        }
    }

    return {
        async acquire(params: { log: ApLogger }): Promise<Sandbox> {
            if (canReuseSandbox(getSettings) && currentSandbox && currentSandbox.isReady()) {
                return currentSandbox
            }
            if (currentSandbox) {
                params.log.info('Sandbox not ready or not reusable, creating fresh one')
                const previous = currentSandbox
                currentSandbox = null
                const { error } = await tryCatch(() => previous.shutdown())
                if (error) {
                    params.log.error({ error }, 'Error shutting down previous sandbox')
                }
            }
            currentSandbox = trackStart(createSandboxForJob({
                ...params,
                boxId,
                reusable: canReuseSandbox(getSettings),
                basePath,
                getSettings,
                getEgress,
                egressNeedsRotation,
            }))
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
            const pendingStart = currentStart
            if (!isNil(pendingStart)) {
                await tryCatch(() => pendingStart)
            }
            const pendingEgress = pendingEgressResolution
            if (!isNil(pendingEgress)) {
                await pendingEgress
            }
            await this.invalidate(log)
            await teardownEgress(log)
        },
        isEgressUnhealthy(): boolean {
            if (consecutiveEgressFailures < MAX_CONSECUTIVE_EGRESS_FAILURES) {
                return false
            }
            return Date.now() < egressProbeAt
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

const MIN_EGRESS_ROTATION_INTERVAL_MS = 60_000

const MAX_CONSECUTIVE_EGRESS_FAILURES = 3

// Stamped at failure time, before the gate's first check, so this plus the gate's pause is one probe.
const EGRESS_PROBE_INTERVAL_MS = 30_000

function toEgressInfo(handle: EgressNetns): EgressInfo {
    return {
        netnsName: handle.netnsName,
        gatewayHost: handle.gatewayHost,
        callbackApiUrl: handle.callbackApiUrl,
        callbackPort: handle.callbackPort,
        apiAllow: handle.apiAllow,
        apiHostPin: handle.apiHostPin,
        fingerprint: handle.fingerprint,
    }
}

function normalizeAllowListKey(allowList: string[]): string {
    return [...allowList].map((entry) => entry.trim()).filter((entry) => entry !== '').sort().join(',')
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
    acquire(params: { log: ApLogger }): Promise<Sandbox>
    invalidate(log: ApLogger): Promise<void>
    release(log: ApLogger): Promise<void>
    shutdown(log: ApLogger): Promise<void>
    isEgressUnhealthy(): boolean
    getActiveSandbox(): ActiveSandboxInfo | null
}
