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
        // malicious code — see .agents/features/network-security.md.
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
    return {
        allowList: options.allowList ?? splitCsv(process.env['AP_SSRF_ALLOW_LIST']),
        allowedLoopbackPorts: new Set(options.allowedLoopbackPorts ?? readSandboxRpcPortFromEnv()),
    }
}

function readSandboxRpcPortFromEnv(): number[] {
    const rpcPort = parseInt(process.env['AP_SANDBOX_WS_PORT'] ?? '', 10)
    return Number.isFinite(rpcPort) ? [rpcPort] : []
}

function splitCsv(raw: string | undefined): string[] {
    if (!raw) return []
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

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
