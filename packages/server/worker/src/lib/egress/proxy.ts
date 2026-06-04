import dns from 'node:dns/promises'
import net from 'node:net'
import { ssrfIpClassifier } from '@activepieces/shared'
import { Logger } from 'pino'
import { Server as ProxyServer, RequestError } from 'proxy-chain'

export async function startEgressProxy({ log, allowList }: StartOptions): Promise<EgressProxy> {
    const server = new ProxyServer({
        port: 0,
        host: '127.0.0.1',
        // proxy-chain expects an empty upstream-override record when the request is allowed through unchanged.
        prepareRequestFunction: async ({ hostname }): Promise<Record<string, never>> => {
            await assertHostnameAllowedOrThrow({ hostname, allowList, log })
            return {}
        },
    })
    await server.listen()
    log.info({ port: server.port }, 'Egress proxy listening on loopback')
    return {
        port: server.port,
        close: () => server.close(true),
    }
}

async function assertHostnameAllowedOrThrow({ hostname, allowList, log }: AssertHostnameAllowedParams): Promise<void> {
    // Resolve every A/AAAA record and reject if any is blocked. Checking only the first
    // resolved IP is bypassable with a multi-record response where one entry is private.
    // Residual risk: proxy-chain re-resolves the hostname for the upstream connection,
    // so a timing-precise DNS rebind between the two lookups is not covered here.
    const ips = net.isIP(hostname) > 0
        ? [hostname]
        : (await dns.lookup(hostname, { all: true })).map((a) => a.address)
    const blocked = ips.find((ip) => ssrfIpClassifier.isBlockedIp({ ip, allowList }))
    if (blocked) {
        log.warn({ host: hostname, ip: blocked, allResolvedIps: ips }, 'Egress proxy refused request')
        throw new RequestError(`Egress blocked: ${hostname}`, 403)
    }
}

type StartOptions = {
    log: Logger
    allowList: string[]
}

type AssertHostnameAllowedParams = {
    hostname: string
    allowList: string[]
    log: Logger
}

export type EgressProxy = {
    port: number
    close: () => Promise<void>
}
