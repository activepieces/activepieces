import dns from 'node:dns/promises'
import net from 'node:net'
import { ActivepiecesError, ErrorCode, ExecutionMode, NetworkMode, tryCatch, WorkerSettingsResponse } from '@activepieces/shared'
import { Logger } from 'pino'
import { workerSettings } from '../config/worker-settings'
import { isIsolateMode } from '../execute/create-sandbox-for-job'
import { sandboxCapacity } from '../sandbox/capacity'
import { iptablesLockdown, IptablesLockdown } from './iptables-lockdown'
import { EgressProxy, startEgressProxy } from './proxy'

export async function startEgressStack({ log, apiUrl }: StartParams): Promise<EgressStack> {
    const settings = workerSettings.getSettings()
    const proxy = await maybeStartProxyAllowingApiHost({ log, apiUrl, settings })

    const { data: lockdown, error: lockdownError } = await tryCatch(
        () => maybeApplyIptablesLockdown({ log, proxy, settings }),
    )
    if (lockdownError) {
        await closeProxyQuietly({ log, proxy })
        throw lockdownError
    }

    return {
        proxyPort: proxy?.port ?? null,
        shutdown: () => shutdownStack({ proxy, lockdown }),
    }
}

async function maybeStartProxyAllowingApiHost({ log, apiUrl, settings }: StartProxyParams): Promise<EgressProxy | null> {
    if (settings.NETWORK_MODE !== NetworkMode.STRICT) return null
    const apiHostIps = await resolveHostToIps({ log, rawUrl: apiUrl })
    const allowList = [...new Set([...settings.SSRF_ALLOW_LIST, ...apiHostIps])]
    const proxy = await startEgressProxy({ log, allowList })
    log.info({ apiHostIps, port: proxy.port }, 'Egress proxy started')
    return proxy
}

async function maybeApplyIptablesLockdown({ log, proxy, settings }: ApplyLockdownParams): Promise<IptablesLockdown | null> {
    if (settings.NETWORK_MODE !== NetworkMode.STRICT) return null
    if (!isIsolateMode(settings.EXECUTION_MODE as ExecutionMode)) return null
    if (!proxy) {
        throw new ActivepiecesError({
            code: ErrorCode.ENGINE_OPERATION_FAILURE,
            params: {
                message: 'Kernel lockdown requires the egress proxy to be running; AP_NETWORK_MODE must be set to STRICT',
            },
        })
    }
    const lockdown = await iptablesLockdown.apply({
        log,
        proxyPort: proxy.port,
        wsRpcPortRange: sandboxCapacity.wsRpcPortRange,
        firstBoxUid: sandboxCapacity.firstBoxUid,
        numBoxes: sandboxCapacity.numBoxes,
    })
    log.info({
        proxyPort: proxy.port,
        firstBoxUid: sandboxCapacity.firstBoxUid,
        numBoxes: sandboxCapacity.numBoxes,
    }, 'Kernel-level SSRF lockdown applied')
    return lockdown
}

async function shutdownStack({ proxy, lockdown }: ShutdownParams): Promise<void> {
    if (lockdown) await lockdown.remove()
    if (proxy) await proxy.close()
}

async function closeProxyQuietly({ log, proxy }: CloseProxyQuietlyParams): Promise<void> {
    if (!proxy) return
    const { error: closeError } = await tryCatch(() => proxy.close())
    if (closeError) log.warn({ closeError }, 'Proxy close failed during SSRF rollback')
}

async function resolveHostToIps({ log, rawUrl }: ResolveHostParams): Promise<string[]> {
    const { data, error } = await tryCatch(async () => {
        const hostname = new URL(rawUrl).hostname
        if (net.isIP(hostname) > 0) return [hostname]
        const addresses = await dns.lookup(hostname, { all: true })
        return addresses.map((a) => a.address)
    })
    if (error) {
        log.warn({ err: error, rawUrl }, 'Failed to resolve API host for egress proxy allowlist')
        return []
    }
    return data
}

type StartParams = {
    log: Logger
    apiUrl: string
}

type StartProxyParams = {
    log: Logger
    apiUrl: string
    settings: WorkerSettingsResponse
}

type ApplyLockdownParams = {
    log: Logger
    proxy: EgressProxy | null
    settings: WorkerSettingsResponse
}

type ShutdownParams = {
    proxy: EgressProxy | null
    lockdown: IptablesLockdown | null
}

type CloseProxyQuietlyParams = {
    log: Logger
    proxy: EgressProxy | null
}

type ResolveHostParams = {
    log: Logger
    rawUrl: string
}

export type EgressStack = {
    proxyPort: number | null
    shutdown: () => Promise<void>
}
