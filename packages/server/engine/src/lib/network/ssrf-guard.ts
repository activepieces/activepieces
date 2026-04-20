import { NetworkMode, ssrfIpClassifier, tryCatchSync } from '@activepieces/shared'
import { installDnsLookupGuard } from './dns-lookup-guard'
import { installEnvProxyDispatcher } from './proxy-dispatcher'
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
        // Install order matters: DNS first so hostname targets fail at resolve time
        // before Socket.connect ever sees them; proxy dispatcher last because it reads
        // HTTP(S)_PROXY env on construction.
        const uninstalls = [
            installDnsLookupGuard(policy),
            installSocketConnectGuard(policy),
            installEnvProxyDispatcher(),
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
    return {
        allowList: options.allowList ?? splitCsv(process.env['AP_SSRF_ALLOW_LIST']),
        allowedLoopbackPorts: new Set(options.allowedLoopbackPorts ?? [
            ...readSandboxRpcPortFromEnv(),
            ...readProxyListenPortsFromEnv(),
        ]),
    }
}

function readSandboxRpcPortFromEnv(): number[] {
    const rpcPort = parseInt(process.env['AP_SANDBOX_WS_PORT'] ?? '', 10)
    return Number.isFinite(rpcPort) ? [rpcPort] : []
}

function readProxyListenPortsFromEnv(): number[] {
    return PROXY_ENV_KEYS.flatMap((key) => {
        const raw = process.env[key]
        if (!raw) return []
        const { data: url } = tryCatchSync(() => new URL(raw))
        if (!url || !LOOPBACK_HOSTS.has(url.hostname)) return []
        if (url.port) return [parseInt(url.port, 10)]
        if (url.protocol === 'http:') return [80]
        if (url.protocol === 'https:') return [443]
        return []
    })
}

function splitCsv(raw: string | undefined): string[] {
    if (!raw) return []
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

const PROXY_ENV_KEYS = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy'] as const
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1'])
const DISABLED_POLICY: GuardPolicy = { allowList: [], allowedLoopbackPorts: new Set() }

export type GuardPolicy = {
    allowList: string[]
    allowedLoopbackPorts: Set<number>
}

export type UninstallFn = () => void

type InstallOptions = {
    enabled?: boolean
    allowList?: string[]
    allowedLoopbackPorts?: number[]
}

type ActiveGuard = {
    enabled: boolean
    policy: GuardPolicy
    uninstall: UninstallFn
}
