import dns from 'node:dns/promises'
import net from 'node:net'
import { type ApLogger } from '@activepieces/server-utils'
import { ssrfIpClassifier } from '@activepieces/shared'
import { Server as ProxyServer, RequestError } from 'proxy-chain'

export async function startEgressProxy({ log, host, allowList }: StartOptions): Promise<EgressProxy> {
    const bindHost = host ?? '127.0.0.1'
    const server = new ProxyServer({
        port: 0,
        host: bindHost,
        // proxy-chain expects an empty upstream-override record when the request is allowed through unchanged.
        prepareRequestFunction: async ({ hostname }): Promise<Record<string, never>> => {
            await assertHostnameAllowedOrThrow({ hostname, allowList, log })
            return {}
        },
    })
    await server.listen()
    log.info({ host: bindHost, port: server.port }, 'Egress proxy listening')
    return {
        port: server.port,
        close: () => server.close(true),
    }
}

async function assertHostnameAllowedOrThrow({ hostname, allowList, log }: AssertHostnameAllowedParams): Promise<void> {
    // Resolve every A/AAAA record and reject if any is blocked. Checking only the first
    // resolved IP is bypassable with a multi-record response where one entry is private.
    //
    // Residual risk (connect-time IP pinning, ADR 0001 hard condition): proxy-chain 2.7.1
    // re-resolves the hostname when it opens the upstream connection. Its public hook
    // (prepareRequestFunction) only lets us override the *upstream proxy* record — it does
    // not expose the upstream socket, so we cannot dial the exact IP we validated here
    // without forking proxy-chain or replacing it with a custom CONNECT server (SNI must
    // still carry the original hostname for TLS to verify). A timing-precise DNS rebind
    // between this lookup and proxy-chain's connect lookup is therefore NOT closed here.
    // This is an accepted residual: under the netns model the sandbox has no route to the
    // internet at all, so the proxy is the single egress door and already rejects
    // private/loopback/link-local/metadata at validation time. Connect-time pinning is a
    // documented follow-up (custom proxy) — see ADR 0001 Phase 1.
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
    log: ApLogger
    host?: string
    allowList: string[]
}

type AssertHostnameAllowedParams = {
    hostname: string
    allowList: string[]
    log: ApLogger
}

export type EgressProxy = {
    port: number
    close: () => Promise<void>
}
