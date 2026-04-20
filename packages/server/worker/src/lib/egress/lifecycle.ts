import dns from 'node:dns/promises'
import net from 'node:net'
import { ExecutionMode, NetworkMode } from '@activepieces/shared'
import { Logger } from 'pino'
import { workerSettings } from '../config/worker-settings'
import { isIsolateMode } from '../execute/create-sandbox-for-job'
import { sandboxCapacity } from '../sandbox/capacity'
import { iptablesLockdown, IptablesLockdown } from './iptables-lockdown'
import { EgressProxy, startEgressProxy } from './proxy'

export async function startEgressStack({ log, apiUrl }: StartParams): Promise<EgressStack> {
    const settings = workerSettings.getSettings()
    const strict = settings.NETWORK_MODE === NetworkMode.STRICT
    const proxy = strict
        ? await startProxyWithApiAllowlist({ log, apiUrl, settings })
        : null
    try {
        const lockdown = strict && isIsolateMode(settings.EXECUTION_MODE as ExecutionMode)
            ? await applyKernelLockdown({ log, proxy })
            : null
        return {
            proxyPort: proxy?.port ?? null,
            shutdown: () => shutdownStack({ proxy, lockdown }),
        }
    }
    catch (err) {
        if (proxy) await proxy.close().catch((closeErr) => log.warn({ closeErr }, 'Proxy close failed during SSRF rollback'))
        throw err
    }
}

async function startProxyWithApiAllowlist({ log, apiUrl, settings }: {
    log: Logger
    apiUrl: string
    settings: ReturnType<typeof workerSettings.getSettings>
}): Promise<EgressProxy> {
    const apiHostIps = await resolveHostToIps({ log, rawUrl: apiUrl })
    const allowList = [...new Set([...settings.SSRF_ALLOW_LIST, ...apiHostIps])]
    const proxy = await startEgressProxy({ log, allowList })
    log.info({ apiHostIps, port: proxy.port }, 'Egress proxy started')
    return proxy
}

async function applyKernelLockdown({ log, proxy }: {
    log: Logger
    proxy: EgressProxy | null
}): Promise<IptablesLockdown> {
    if (!proxy) {
        throw new Error('Kernel lockdown requires the egress proxy to be running; AP_NETWORK_MODE must be set to STRICT')
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

async function shutdownStack({ proxy, lockdown }: {
    proxy: EgressProxy | null
    lockdown: IptablesLockdown | null
}): Promise<void> {
    if (lockdown) await lockdown.remove()
    if (proxy) await proxy.close()
}

async function resolveHostToIps({ log, rawUrl }: { log: Logger, rawUrl: string }): Promise<string[]> {
    try {
        const hostname = new URL(rawUrl).hostname
        if (net.isIP(hostname) > 0) return [hostname]
        const addresses = await dns.lookup(hostname, { all: true })
        return addresses.map((a) => a.address)
    }
    catch (err) {
        log.warn({ err, rawUrl }, 'Failed to resolve API host for egress proxy allowlist')
        return []
    }
}

type StartParams = {
    log: Logger
    apiUrl: string
}

export type EgressStack = {
    proxyPort: number | null
    shutdown: () => Promise<void>
}
