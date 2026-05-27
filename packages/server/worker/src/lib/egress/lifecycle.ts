import dnsSync from 'node:dns'
import dns from 'node:dns/promises'
import { readFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
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
    const hostNameservers = listDnsNameservers()
    const { nameservers: sandboxNameservers, readError: sandboxResolvConfReadError } = await readSandboxResolvConfNameservers()
    if (sandboxResolvConfReadError !== undefined) {
        log.warn(
            { sandboxResolvConf: SANDBOX_RESOLV_CONF_PATH, err: sandboxResolvConfReadError },
            'Could not read sandbox resolv.conf — DNS allowlist will only include host nameservers, which may not match what the sandbox queries. This is the exact condition that caused the 2026-05-06 EAI_AGAIN outage.',
        )
    }
    else if (sandboxNameservers.length === 0) {
        log.warn(
            { sandboxResolvConf: SANDBOX_RESOLV_CONF_PATH },
            'Sandbox resolv.conf was readable but contained no nameserver lines — DNS allowlist will only include host nameservers.',
        )
    }
    const nameservers = [...new Set([...hostNameservers, ...sandboxNameservers])]
    if (nameservers.length === 0) {
        const message = 'No DNS nameservers configured on the worker host or sandbox resolv.conf — refusing to apply kernel lockdown that would starve the sandbox of name resolution. ' +
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

async function listSandboxResolvConfNameservers(): Promise<string[]> {
    const { nameservers } = await readSandboxResolvConfNameservers()
    return nameservers
}

async function readSandboxResolvConfNameservers(): Promise<{ nameservers: string[], readError?: Error }> {
    const { data, error } = await tryCatch(() => readFile(SANDBOX_RESOLV_CONF_PATH, 'utf8'))
    if (error !== null) return { nameservers: [], readError: error }
    return { nameservers: parseResolvConfNameservers(data) }
}

function parseResolvConfNameservers(body: string): string[] {
    const ips: string[] = []
    for (const rawLine of body.split('\n')) {
        const line = rawLine.replace(/#.*$/, '').trim()
        const match = line.match(/^nameserver\s+(\S+)$/i)
        if (!match) continue
        const ip = extractNameserverIp(match[1])
        if (ip) ips.push(ip)
    }
    return ips
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

export const egressInternals = {
    listSandboxResolvConfNameservers,
    parseResolvConfNameservers,
}

const SANDBOX_RESOLV_CONF_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets/etc/resolv.conf')
