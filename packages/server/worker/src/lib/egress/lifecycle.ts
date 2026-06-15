import dns from 'node:dns/promises'
import net from 'node:net'
import { type ApLogger } from '@activepieces/server-utils'
import { ActivepiecesError, ErrorCode, NetworkMode, tryCatch } from '@activepieces/shared'
import { workerSettings } from '../config/worker-settings'
import { egressNetns, EgressNetns } from './netns'
import { startEgressProxy } from './proxy'

export async function startEgressStack({ log, apiUrl }: StartParams): Promise<EgressStack> {
    const settings = workerSettings.getSettings()
    if (settings.NETWORK_MODE !== NetworkMode.STRICT) {
        return {
            proxyPort: null,
            gatewayHost: null,
            netnsName: null,
            shutdown: async () => {},
        }
    }

    const ns = await egressNetns.create({ log })

    const { data: apiHostIps, error: resolveError } = await tryCatch(() => resolveHostToIps({ rawUrl: apiUrl }))
    if (resolveError) {
        await ns.destroy()
        const message = `Failed to resolve API host "${apiUrl}" for egress proxy allow list in STRICT mode — worker refuses to start in a silently broken state. ` +
            `Resolve the DNS issue or pre-list the API IPs in AP_SSRF_ALLOW_LIST. ${resolveError.message}`
        throw new ActivepiecesError(
            { code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message } },
            message,
        )
    }

    const allowList = [...new Set([...settings.SSRF_ALLOW_LIST, ...apiHostIps])]
    const { data: proxy, error: proxyError } = await tryCatch(() => startEgressProxy({ log, host: ns.gatewayHost, allowList }))
    if (proxyError) {
        await ns.destroy()
        throw proxyError
    }

    log.info({ apiHostIps, gatewayHost: ns.gatewayHost, port: proxy.port }, 'Egress proxy started on gateway')
    return {
        proxyPort: proxy.port,
        gatewayHost: ns.gatewayHost,
        netnsName: ns.netnsName,
        shutdown: () => shutdownStack({ proxy, ns }),
    }
}

async function shutdownStack({ proxy, ns }: ShutdownParams): Promise<void> {
    await proxy.close()
    await ns.destroy()
}

async function resolveHostToIps({ rawUrl }: ResolveHostParams): Promise<string[]> {
    const hostname = new URL(rawUrl).hostname
    if (net.isIP(hostname) > 0) return [hostname]
    const addresses = await dns.lookup(hostname, { all: true })
    return addresses.map((a) => a.address)
}

type StartParams = {
    log: ApLogger
    apiUrl: string
}

type ShutdownParams = {
    proxy: { close: () => Promise<void> }
    ns: EgressNetns
}

type ResolveHostParams = {
    rawUrl: string
}

export type EgressStack = {
    proxyPort: number | null
    gatewayHost: string | null
    netnsName: string | null
    shutdown: () => Promise<void>
}
