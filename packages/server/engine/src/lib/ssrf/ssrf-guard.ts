import dns from 'node:dns'
import { isIP, Socket } from 'node:net'
import { ssrfIpClassifier } from '@activepieces/shared'
import { EnvHttpProxyAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici'

let currentGuard: InstalledGuard | null = null

export const ssrfGuard = {
    install: installSsrfGuard,
    uninstall: uninstallSsrfGuard,
    isBlockedIp: (ip: string): boolean => isBlocked(ip, currentGuard?.policy ?? emptyPolicy()),
    isEnabled: (): boolean => currentGuard?.enabled ?? false,
}

export class SSRFBlockedError extends Error {
    constructor(host: string, ip: string) {
        super(`SSRF protection: refusing to connect to ${host} (resolved ${ip}) — private, loopback, link-local, or multicast address`)
        this.name = 'SSRFBlockedError'
    }
}

function installSsrfGuard(options: InstallOptions = {}): void {
    uninstallSsrfGuard()
    const enabled = options.enabled ?? (process.env['AP_SSRF_PROTECTION_ENABLED'] === 'true')
    if (!enabled) {
        currentGuard = { enabled: false, uninstall: () => undefined, policy: emptyPolicy() }
        return
    }
    const policy: GuardPolicy = {
        allowList: options.allowList ?? parseAllowList(process.env['AP_SSRF_ALLOW_LIST']),
        allowedLoopbackPorts: new Set(options.allowedLoopbackPorts ?? collectLoopbackPortsFromEnv()),
    }
    const uninstalls = [
        installDnsHook(policy),
        installNetHook(policy),
        installUndiciHook(),
    ]
    currentGuard = {
        enabled: true,
        policy,
        uninstall: () => uninstalls.forEach((fn) => fn()),
    }
}

function uninstallSsrfGuard(): void {
    currentGuard?.uninstall()
    currentGuard = null
}

function installDnsHook(policy: GuardPolicy): Uninstall {
    const originalLookup = dns.lookup
    const originalPromisesLookup = dns.promises.lookup
    const boundLookup = originalLookup.bind(dns) as typeof dns.lookup
    const boundPromisesLookup = originalPromisesLookup.bind(dns.promises) as typeof dns.promises.lookup

    const wrappedLookup = function lookup(...args: unknown[]): unknown {
        const [hostname, optionsOrCallback, maybeCallback] = args
        const callback = typeof optionsOrCallback === 'function'
            ? optionsOrCallback as DnsCallback
            : maybeCallback as DnsCallback | undefined
        const options = typeof optionsOrCallback === 'object' ? optionsOrCallback : undefined

        const onResult: DnsCallback = (err, address, family) => {
            if (err || !callback) {
                callback?.(err, address, family)
                return
            }
            const blocked = findBlockedAddress({ address, family, policy })
            if (blocked) {
                callback(new SSRFBlockedError(String(hostname), blocked), '' as string, 0)
                return
            }
            callback(null, address, family)
        }
        return (boundLookup as (...a: unknown[]) => unknown)(hostname, options ?? {}, onResult)
    }
    Object.assign(wrappedLookup, originalLookup)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(dns as any).lookup = wrappedLookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(dns.promises as any).lookup = async (hostname: string, options?: dns.LookupOptions) => {
        const result = await boundPromisesLookup(hostname, options as dns.LookupOptions & { all: true })
        const addresses = Array.isArray(result) ? result : [result]
        for (const entry of addresses) {
            if (isBlocked(entry.address, policy)) {
                throw new SSRFBlockedError(hostname, entry.address)
            }
        }
        return result
    }

    return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dns as any).lookup = originalLookup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(dns.promises as any).lookup = originalPromisesLookup
    }
}

function installNetHook(policy: GuardPolicy): Uninstall {
    const originalConnect = Socket.prototype.connect
    Socket.prototype.connect = function connect(this: Socket, ...args: Parameters<typeof originalConnect>): Socket {
        const target = extractHostPort(args)
        if (target?.host && isIP(target.host) > 0 && !isAllowedTarget({ ip: target.host, port: target.port, policy })) {
            this.destroy(new SSRFBlockedError(target.host, target.host))
            return this
        }
        return originalConnect.apply(this, args)
    }
    return () => {
        Socket.prototype.connect = originalConnect
    }
}

function installUndiciHook(): Uninstall {
    const hasProxy = Boolean(
        process.env['HTTPS_PROXY'] ?? process.env['https_proxy']
        ?? process.env['HTTP_PROXY'] ?? process.env['http_proxy'],
    )
    if (!hasProxy) {
        return () => undefined
    }
    const originalDispatcher = getGlobalDispatcher()
    setGlobalDispatcher(new EnvHttpProxyAgent())
    return () => setGlobalDispatcher(originalDispatcher)
}

function findBlockedAddress({ address, family, policy }: {
    address: string | dns.LookupAddress[]
    family: number | undefined
    policy: GuardPolicy
}): string | undefined {
    const addresses = Array.isArray(address) ? address : [{ address: address as string, family: family ?? 4 }]
    return addresses.find((entry) => isBlocked(entry.address, policy))?.address
}

function isAllowedTarget({ ip, port, policy }: { ip: string, port: number | undefined, policy: GuardPolicy }): boolean {
    if (!isBlocked(ip, policy)) return true
    return ip === '127.0.0.1' && port !== undefined && policy.allowedLoopbackPorts.has(port)
}

function isBlocked(ip: string, policy: GuardPolicy): boolean {
    return ssrfIpClassifier.isBlockedIp({ ip, allowList: policy.allowList })
}

function extractHostPort(args: unknown[]): { host?: string, port?: number } | undefined {
    const first = args[0]
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
        const opts = first as { host?: string, port?: number }
        return { host: opts.host, port: opts.port }
    }
    if (typeof first === 'number') {
        const host = typeof args[1] === 'string' ? args[1] : '127.0.0.1'
        return { host, port: first }
    }
    return undefined
}

function collectLoopbackPortsFromEnv(): number[] {
    const ports: number[] = []
    const rpcPort = parsePort(process.env['AP_SANDBOX_WS_PORT'])
    if (rpcPort !== undefined) ports.push(rpcPort)
    for (const key of PROXY_ENV_KEYS) {
        const proxyPort = extractPortFromProxyUrl(process.env[key])
        if (proxyPort !== undefined) ports.push(proxyPort)
    }
    return ports
}

function extractPortFromProxyUrl(raw: string | undefined): number | undefined {
    if (!raw) return undefined
    try {
        const url = new URL(raw)
        if (!LOOPBACK_HOSTS.has(url.hostname)) return undefined
        if (url.port) return parseInt(url.port, 10)
        if (url.protocol === 'http:') return 80
        if (url.protocol === 'https:') return 443
    }
    catch {
        return undefined
    }
    return undefined
}

function parseAllowList(raw: string | undefined): string[] {
    if (!raw) return []
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

function parsePort(raw: string | undefined): number | undefined {
    if (!raw) return undefined
    const parsed = parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : undefined
}

function emptyPolicy(): GuardPolicy {
    return { allowList: [], allowedLoopbackPorts: new Set() }
}

const PROXY_ENV_KEYS = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy'] as const
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1'])

type InstallOptions = {
    enabled?: boolean
    allowList?: string[]
    allowedLoopbackPorts?: number[]
}

type GuardPolicy = {
    allowList: string[]
    allowedLoopbackPorts: Set<number>
}

type InstalledGuard = {
    enabled: boolean
    policy: GuardPolicy
    uninstall: Uninstall
}

type Uninstall = () => void

type DnsCallback = (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void

installSsrfGuard()
