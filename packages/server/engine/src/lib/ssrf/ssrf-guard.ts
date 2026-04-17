import dns from 'node:dns'
import { isIP, Socket } from 'node:net'
import { Dispatcher, getGlobalDispatcher, ProxyAgent, setGlobalDispatcher } from 'undici'

type InstallOptions = {
    enabled?: boolean
    allowList?: string[]
    allowedLoopbackPorts?: number[]
}

type GuardState = {
    enabled: boolean
    allowList: string[]
    allowedLoopbackPorts: Set<number>
    originalLookup?: typeof dns.lookup
    originalPromisesLookup?: typeof dns.promises.lookup
    originalConnect?: typeof Socket.prototype.connect
    originalDispatcher?: Dispatcher
}

const state: GuardState = {
    enabled: false,
    allowList: [],
    allowedLoopbackPorts: new Set(),
}

installSsrfGuard()

function installSsrfGuard(options: InstallOptions = {}): void {
    const enabled = options.enabled ?? (process.env['AP_SSRF_PROTECTION_ENABLED'] === 'true')
    state.enabled = enabled
    state.allowList = options.allowList ?? parseAllowList(process.env['AP_SSRF_ALLOW_LIST'])
    state.allowedLoopbackPorts = new Set(options.allowedLoopbackPorts ?? collectLoopbackPortsFromEnv())

    if (!enabled) {
        return
    }
    if (!state.originalLookup) {
        hookDns()
    }
    if (!state.originalConnect) {
        hookNet()
    }
    if (!state.originalDispatcher) {
        hookUndiciDispatcher()
    }
}

function hookUndiciDispatcher(): void {
    const proxyUrl = process.env['HTTPS_PROXY'] ?? process.env['https_proxy'] ?? process.env['HTTP_PROXY'] ?? process.env['http_proxy']
    if (!proxyUrl) {
        return
    }
    state.originalDispatcher = getGlobalDispatcher()
    setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl }))
}

function collectLoopbackPortsFromEnv(): number[] {
    const ports: number[] = []
    const rpcPort = parsePort(process.env['AP_SANDBOX_WS_PORT'])
    if (rpcPort !== undefined) ports.push(rpcPort)
    for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']) {
        const proxyPort = extractPortFromProxyUrl(process.env[key])
        if (proxyPort !== undefined) ports.push(proxyPort)
    }
    return ports
}

function extractPortFromProxyUrl(raw: string | undefined): number | undefined {
    if (!raw) return undefined
    try {
        const url = new URL(raw)
        if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost' && url.hostname !== '::1') {
            return undefined
        }
        if (url.port) return parseInt(url.port, 10)
        if (url.protocol === 'http:') return 80
        if (url.protocol === 'https:') return 443
    }
    catch {
        return undefined
    }
    return undefined
}

function uninstallSsrfGuard(): void {
    if (state.originalLookup) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dns as any).lookup = state.originalLookup
        state.originalLookup = undefined
    }
    if (state.originalPromisesLookup) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dns.promises as any).lookup = state.originalPromisesLookup
        state.originalPromisesLookup = undefined
    }
    if (state.originalConnect) {
        Socket.prototype.connect = state.originalConnect
        state.originalConnect = undefined
    }
    if (state.originalDispatcher) {
        setGlobalDispatcher(state.originalDispatcher)
        state.originalDispatcher = undefined
    }
    state.enabled = false
    state.allowList = []
    state.allowedLoopbackPorts = new Set()
}

function hookDns(): void {
    const originalLookup = dns.lookup.bind(dns) as typeof dns.lookup
    const originalPromisesLookup = dns.promises.lookup.bind(dns.promises) as typeof dns.promises.lookup
    state.originalLookup = dns.lookup
    state.originalPromisesLookup = dns.promises.lookup

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
            const addresses = Array.isArray(address) ? address : [{ address: address as string, family: family ?? 4 }]
            for (const entry of addresses) {
                if (isBlockedIp(entry.address)) {
                    callback(new SSRFBlockedError(String(hostname), entry.address), '' as string, 0)
                    return
                }
            }
            callback(null, address, family)
        }

        return (originalLookup as (...a: unknown[]) => unknown)(hostname, options ?? {}, onResult)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.assign(wrappedLookup, originalLookup)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(dns as any).lookup = wrappedLookup

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(dns.promises as any).lookup = async (hostname: string, options?: dns.LookupOptions) => {
        const result = await originalPromisesLookup(hostname, options as dns.LookupOptions & { all: true })
        const addresses = Array.isArray(result) ? result : [result]
        for (const entry of addresses) {
            if (isBlockedIp(entry.address)) {
                throw new SSRFBlockedError(hostname, entry.address)
            }
        }
        return result
    }
}

function hookNet(): void {
    const originalConnect = Socket.prototype.connect
    state.originalConnect = originalConnect
    Socket.prototype.connect = function connect(this: Socket, ...args: Parameters<typeof originalConnect>): Socket {
        const target = extractHostPort(args)
        if (target && target.host && isIP(target.host) > 0) {
            if (!isAllowedTarget(target.host, target.port)) {
                this.destroy(new SSRFBlockedError(target.host, target.host))
                return this
            }
        }
        return originalConnect.apply(this, args)
    }
}

function extractHostPort(args: unknown[]): { host?: string, port?: number } | undefined {
    const first = args[0]
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
        const opts = first as { host?: string, port?: number }
        return { host: opts.host, port: opts.port }
    }
    if (typeof first === 'number') {
        const second = args[1]
        const host = typeof second === 'string' ? second : '127.0.0.1'
        return { host, port: first }
    }
    return undefined
}

function isAllowedTarget(ip: string, port: number | undefined): boolean {
    if (matchesAllowList(ip, state.allowList)) {
        return true
    }
    if (!isBlockedIp(ip)) {
        return true
    }
    if (ip === '127.0.0.1' && port !== undefined && state.allowedLoopbackPorts.has(port)) {
        return true
    }
    return false
}

function isBlockedIp(ip: string): boolean {
    if (matchesAllowList(ip, state.allowList)) {
        return false
    }
    const version = isIP(ip)
    if (version === 4) {
        return isBlockedIPv4(ip)
    }
    if (version === 6) {
        return isBlockedIPv6(ip)
    }
    return false
}

function isBlockedIPv4(ip: string): boolean {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
        return true
    }
    const [a, b] = parts
    if (a === 0) return true
    if (a === 10) return true
    if (a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    if (a >= 224) return true
    return false
}

function isBlockedIPv6(ip: string): boolean {
    const lower = ip.toLowerCase().split('%')[0]
    const mapped = extractMappedIPv4(lower)
    if (mapped) {
        return isBlockedIPv4(mapped)
    }
    if (lower === '::1' || lower === '::') return true
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true
    if (lower.startsWith('ff')) return true
    if (lower.startsWith('64:ff9b:')) return true
    if (lower.startsWith('2001:db8:')) return true
    return false
}

function extractMappedIPv4(ip: string): string | undefined {
    const prefixes = ['::ffff:', '::']
    for (const prefix of prefixes) {
        if (ip.startsWith(prefix)) {
            const suffix = ip.slice(prefix.length)
            if (isIP(suffix) === 4) {
                return suffix
            }
        }
    }
    return undefined
}

function matchesAllowList(ip: string, allowList: string[]): boolean {
    return allowList.some((entry) => entry === ip)
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

type DnsCallback = (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void

export class SSRFBlockedError extends Error {
    constructor(host: string, ip: string) {
        super(`SSRF protection: refusing to connect to ${host} (resolved ${ip}) — private, loopback, link-local, or multicast address`)
        this.name = 'SSRFBlockedError'
    }
}

export const ssrfGuard = {
    install: installSsrfGuard,
    uninstall: uninstallSsrfGuard,
    isBlockedIp,
    isEnabled: () => state.enabled,
}
