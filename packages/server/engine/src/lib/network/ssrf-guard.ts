import { ssrfIpClassifier } from '@activepieces/core-utils'
import { NetworkMode } from '@activepieces/shared'
import { installDnsLookupGuard } from './dns-lookup-guard'
import { installSocketConnectGuard } from './socket-connect-guard'

let currentGuard: ActiveGuard | null = null

export const ssrfGuard = {
    install(options: InstallOptions = {}): void {
        currentGuard?.uninstall()
        currentGuard = null

        if (!isGuardEnabled(options)) {
            currentGuard = { enabled: false, policy: DISABLED_POLICY, uninstall: () => undefined }
            return
        }

        const policy = buildGuardPolicy(options)
        // Best-effort, in-process only: DNS first so hostname targets fail at resolve
        // time before Socket.connect ever sees them; the socket guard then catches raw
        // IP connects. These JS monkeypatches stop accidental SSRF (a piece naively
        // fetching a user-supplied internal URL) but are NOT a boundary against
        // malicious code (worker_threads / process.binding / native addons bypass them).
        const uninstalls = [
            installDnsLookupGuard(policy),
            installSocketConnectGuard(policy),
        ]
        currentGuard = {
            enabled: true,
            policy,
            uninstall: () => [...uninstalls].reverse().forEach((fn) => fn()),
        }
    },
    uninstall(): void {
        currentGuard?.uninstall()
        currentGuard = null
    },
    isBlockedIp(ip: string): boolean {
        return ssrfIpClassifier.isBlockedIp({ ip, allowList: currentGuard?.policy.allowList ?? [] })
    },
    isEnabled(): boolean {
        return currentGuard?.enabled ?? false
    },
}

function isGuardEnabled(options: InstallOptions): boolean {
    return options.enabled ?? process.env['AP_NETWORK_MODE'] === NetworkMode.STRICT
}

function buildGuardPolicy(options: InstallOptions): GuardPolicy {
    const allowedHostPorts = new Set<string>()
    const loopbackPorts = options.allowedLoopbackPorts ?? readSandboxRpcPortFromEnv()
    for (const port of loopbackPorts) {
        allowedHostPorts.add(`127.0.0.1:${port}`)
        allowedHostPorts.add(`::1:${port}`)
    }
    for (const endpoint of options.allowedHostPorts ?? []) {
        allowedHostPorts.add(endpoint)
    }
    for (const endpoint of readSandboxHostPortsFromEnv()) {
        allowedHostPorts.add(endpoint)
    }
    return {
        allowList: options.allowList ?? splitCsv(process.env['AP_SSRF_ALLOW_LIST']),
        allowedHostPorts,
        pinnedHosts: buildPinnedHosts(options.pinnedHosts ?? process.env['AP_SANDBOX_API_HOST_PIN']),
    }
}

// An internal app hostname does not resolve inside the box, and rewriting the URL would drop SNI.
function buildPinnedHosts(raw: string | Record<string, string[]> | undefined): Map<string, string[]> {
    const pinned = new Map<string, string[]>()
    if (!raw) {
        return pinned
    }
    const entries = typeof raw === 'string' ? parsePinnedHostsSpec(raw) : Object.entries(raw)
    for (const [hostname, ips] of entries) {
        const usable = ips.map((ip) => ip.trim()).filter(isIpv4Literal)
        if (hostname === '' || usable.length === 0) {
            continue
        }
        pinned.set(hostname.toLowerCase(), usable)
    }
    return pinned
}

function parsePinnedHostsSpec(raw: string): Array<[string, string[]]> {
    const separatorIndex = raw.indexOf('=')
    if (separatorIndex <= 0) {
        return []
    }
    return [[raw.slice(0, separatorIndex).trim(), raw.slice(separatorIndex + 1).split(',')]]
}

function readSandboxRpcPortFromEnv(): number[] {
    const rpcPort = parseInt(process.env['AP_SANDBOX_WS_PORT'] ?? '', 10)
    return Number.isFinite(rpcPort) ? [rpcPort] : []
}

function readSandboxHostPortsFromEnv(): string[] {
    const endpoints: string[] = []
    const host = process.env['AP_SANDBOX_WS_HOST']?.trim()
    if (host) {
        const wsPort = parseInt(process.env['AP_SANDBOX_WS_PORT'] ?? '', 10)
        if (Number.isFinite(wsPort)) {
            endpoints.push(`${host}:${wsPort}`)
        }
        const callbackPort = parseInt(process.env['AP_SANDBOX_CALLBACK_PORT'] ?? '', 10)
        if (Number.isFinite(callbackPort)) {
            endpoints.push(`${host}:${callbackPort}`)
        }
    }
    // One kernel ACCEPT per address, so the exemption must cover all of them; undici picks any.
    for (const apiAllow of splitCsv(process.env['AP_SANDBOX_API_ALLOW'])) {
        if (isHostPortEndpoint(apiAllow)) {
            endpoints.push(apiAllow)
        }
    }
    return endpoints
}

function isHostPortEndpoint(value: string): boolean {
    const separatorIndex = value.lastIndexOf(':')
    if (separatorIndex <= 0) {
        return false
    }
    if (!isIpv4Literal(value.slice(0, separatorIndex))) {
        return false
    }
    const port = Number(value.slice(separatorIndex + 1))
    return Number.isInteger(port) && port > 0 && port <= 65535
}

function isIpv4Literal(value: string): boolean {
    const octets = value.split('.')
    return octets.length === 4 && octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255)
}

function splitCsv(raw: string | undefined): string[] {
    if (!raw) return []
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

const DISABLED_POLICY: GuardPolicy = { allowList: [], allowedHostPorts: new Set(), pinnedHosts: new Map() }

export type GuardPolicy = {
    allowList: string[]
    allowedHostPorts: Set<string>
    pinnedHosts: Map<string, string[]>
}

export type UninstallFn = () => void

type InstallOptions = {
    enabled?: boolean
    allowList?: string[]
    allowedLoopbackPorts?: number[]
    allowedHostPorts?: string[]
    pinnedHosts?: Record<string, string[]>
}

type ActiveGuard = {
    enabled: boolean
    policy: GuardPolicy
    uninstall: UninstallFn
}
