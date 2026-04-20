import dns from 'node:dns'
import { isIP, Socket } from 'node:net'
import { EngineGenericError, NetworkMode, ssrfIpClassifier } from '@activepieces/shared'
import { EnvHttpProxyAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici'

let currentGuard: InstalledGuard | null = null

export const ssrfGuard = {
    install(options: InstallOptions = {}): void {
        currentGuard?.uninstall()
        currentGuard = null
        const enabled = options.enabled ?? (process.env['AP_NETWORK_MODE'] === NetworkMode.STRICT)
        if (!enabled) {
            currentGuard = { enabled: false, uninstall: () => undefined, policy: EMPTY_POLICY }
            return
        }
        const policy: GuardPolicy = {
            allowList: options.allowList ?? parseCsv(process.env['AP_SSRF_ALLOW_LIST']),
            allowedLoopbackPorts: new Set(options.allowedLoopbackPorts ?? loopbackPortsFromEnv()),
        }
        const uninstalls = [installDnsHook(policy), installSocketHook(policy), installUndiciHook()]
        currentGuard = {
            enabled: true,
            policy,
            uninstall: () => uninstalls.forEach((fn) => fn()),
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

function blockedError(host: string, ip: string): EngineGenericError {
    return new EngineGenericError(
        'SSRFBlockedError',
        `SSRF protection: refusing to connect to ${host} (resolved ${ip}) — private, loopback, link-local, or multicast address`,
    )
}

function installDnsHook(policy: GuardPolicy): Uninstall {
    const originalLookup = dns.lookup
    const originalPromisesLookup = dns.promises.lookup
    const boundLookup = originalLookup.bind(dns) as typeof dns.lookup
    const boundPromisesLookup = originalPromisesLookup.bind(dns.promises) as typeof dns.promises.lookup

    const wrappedLookup = function lookup(...args: unknown[]): unknown {
        const [hostname, optionsOrCallback, maybeCallback] = args
        const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback as DnsCallback : maybeCallback as DnsCallback | undefined
        const callerOptions = typeof optionsOrCallback === 'object' && optionsOrCallback !== null
            ? optionsOrCallback as dns.LookupOptions
            : undefined
        const guarded: DnsCallback = (err, address, family) => {
            if (err || !callback) {
                callback?.(err, address, family)
                return
            }
            const entries = Array.isArray(address) ? address : [{ address: address as string, family: family ?? 4 }]
            const blocked = entries.find((e) => ssrfIpClassifier.isBlockedIp({ ip: e.address, allowList: policy.allowList }))
            if (blocked) {
                callback(blockedError(String(hostname), blocked.address), '' as string, 0)
                return
            }
            if (callerOptions?.all) {
                callback(null, entries)
                return
            }
            const first = entries[0]
            if (!first) {
                callback(null, '' as string, 0)
                return
            }
            callback(null, first.address, first.family)
        }
        return (boundLookup as (...a: unknown[]) => unknown)(hostname, { ...callerOptions, all: true }, guarded)
    }
    Object.assign(wrappedLookup, originalLookup)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(dns as any).lookup = wrappedLookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(dns.promises as any).lookup = async (hostname: string, options?: dns.LookupOptions) => {
        const all = await boundPromisesLookup(hostname, { ...options, all: true })
        for (const entry of all) {
            if (ssrfIpClassifier.isBlockedIp({ ip: entry.address, allowList: policy.allowList })) {
                throw blockedError(hostname, entry.address)
            }
        }
        return options?.all ? all : all[0]
    }

    return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dns as any).lookup = originalLookup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(dns.promises as any).lookup = originalPromisesLookup
    }
}

function installSocketHook(policy: GuardPolicy): Uninstall {
    const originalConnect = Socket.prototype.connect
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Socket.prototype.connect = function connect(this: Socket, ...args: any[]): Socket {
        const target = extractHostPort(args)
        const host = target?.host
        if (host && isIP(host) > 0 && ssrfIpClassifier.isBlockedIp({ ip: host, allowList: policy.allowList })) {
            const isAllowedLoopback = host === '127.0.0.1' && target.port !== undefined && policy.allowedLoopbackPorts.has(target.port)
            if (!isAllowedLoopback) {
                this.destroy(blockedError(host, host))
                return this
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (originalConnect as (...a: any[]) => Socket).apply(this, args)
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
    if (!hasProxy) return () => undefined
    const originalDispatcher = getGlobalDispatcher()
    setGlobalDispatcher(new EnvHttpProxyAgent())
    return () => setGlobalDispatcher(originalDispatcher)
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

function loopbackPortsFromEnv(): number[] {
    const ports: number[] = []
    const rpcPort = parseInt(process.env['AP_SANDBOX_WS_PORT'] ?? '', 10)
    if (Number.isFinite(rpcPort)) ports.push(rpcPort)
    for (const key of PROXY_ENV_KEYS) {
        const raw = process.env[key]
        if (!raw) continue
        try {
            const url = new URL(raw)
            if (!LOOPBACK_HOSTS.has(url.hostname)) continue
            if (url.port) ports.push(parseInt(url.port, 10))
            else if (url.protocol === 'http:') ports.push(80)
            else if (url.protocol === 'https:') ports.push(443)
        }
        catch { /* ignore malformed proxy URL */ }
    }
    return ports
}

function parseCsv(raw: string | undefined): string[] {
    if (!raw) return []
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

const PROXY_ENV_KEYS = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy'] as const
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1'])
const EMPTY_POLICY: GuardPolicy = { allowList: [], allowedLoopbackPorts: new Set() }

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

// Self-install on module import — main.ts relies on the guard being active before engine code runs.
ssrfGuard.install()
