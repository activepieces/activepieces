import dns from 'node:dns/promises'
import net from 'node:net'
import { ssrfIpClassifier } from '@activepieces/shared'
import { Logger } from 'pino'
import { Server as ProxyServer, RequestError } from 'proxy-chain'

export async function startEgressProxy({ log, allowList }: StartOptions): Promise<EgressProxy> {
    const server = new ProxyServer({
        port: 0,
        host: '127.0.0.1',
        prepareRequestFunction: async ({ hostname }): Promise<Record<string, never>> => {
            await assertHostAllowed({ hostname, allowList, log })
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

async function assertHostAllowed({ hostname, allowList, log }: AssertArgs): Promise<void> {
    const ip = net.isIP(hostname) > 0
        ? hostname
        : (await dns.lookup(hostname)).address
    if (ssrfIpClassifier.isBlockedIp({ ip, allowList })) {
        log.warn({ host: hostname, ip }, 'Egress proxy refused request')
        throw new RequestError(`Egress blocked: ${hostname}`, 403)
    }
}

type StartOptions = {
    log: Logger
    allowList: string[]
}

type AssertArgs = {
    hostname: string
    allowList: string[]
    log: Logger
}

export type EgressProxy = {
    port: number
    close: () => Promise<void>
}
