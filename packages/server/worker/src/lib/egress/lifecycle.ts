import dnsSync from 'node:dns'
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
    const { data: apiHostIps, error: resolveError } = await tryCatch(() => resolveHostToIps({ rawUrl: apiUrl }))
    if (resolveError) {
        const failureMessage = `Failed to resolve API host "${apiUrl}" for egress proxy allow list in STRICT mode — worker refuses to start in a silently broken state. ` +
            `Resolve the DNS issue or pre-list the API IPs in AP_SSRF_ALLOW_LIST. ${resolveError.message}`
        throw new ActivepiecesError(
            { code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message: failureMessage } },
            failureMessage,
        )
    }
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
    const nameservers = listDnsNameservers()
    if (nameservers.length === 0) {
        const message = 'No DNS nameservers configured on the worker host — refusing to apply kernel lockdown that would starve the sandbox of name resolution. ' +
            'Ensure /etc/resolv.conf has at least one valid nameserver, or inspect dns.getServers() output.'
        throw new ActivepiecesError(
            { code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message } },
            message,
        )
    }
    const lockdown = await iptablesLockdown.apply({
        log,
        proxyPort: proxy.port,
        wsRpcPortRange: sandboxCapacity.wsRpcPortRange,
        firstBoxUid: sandboxCapacity.firstBoxUid,
        numBoxes: sandboxCapacity.numBoxes,
        nameservers,
    })
    log.info({
        proxyPort: proxy.port,
        firstBoxUid: sandboxCapacity.firstBoxUid,
        numBoxes: sandboxCapacity.numBoxes,
        nameservers,
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

async function resolveHostToIps({ rawUrl }: ResolveHostParams): Promise<string[]> {
    const hostname = new URL(rawUrl).hostname
    if (net.isIP(hostname) > 0) return [hostname]
    const addresses = await dns.lookup(hostname, { all: true })
    return addresses.map((a) => a.address)
}

function listDnsNameservers(): string[] {
    return dnsSync.getServers().map(extractNameserverIp).filter((ip): ip is string => ip !== null)
}

function extractNameserverIp(server: string): string | null {
    if (net.isIP(server) > 0) return server
    const bracketed = server.match(/^\[([^\]]+)\](?::\d+)?$/)
    if (bracketed && net.isIP(bracketed[1]) > 0) return bracketed[1]
    const v4WithPort = server.match(/^(\d+\.\d+\.\d+\.\d+):\d+$/)
    if (v4WithPort && net.isIP(v4WithPort[1]) === 4) return v4WithPort[1]
    return null
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
    rawUrl: string
}

export type EgressStack = {
    proxyPort: number | null
    shutdown: () => Promise<void>
}
