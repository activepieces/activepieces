import dns from 'node:dns/promises'
import { FastifyRequest } from 'fastify'
import { system, SystemProp } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'

const GOOGLE_DNS = '216.239.32.10'
const PUBLIC_IP_ADDRESS_QUERY = 'o-o.myaddr.l.google.com'
const CLIENT_REAL_IP_HEADER = system.getOrThrow(
    SystemProp.CLIENT_REAL_IP_HEADER,
)

let ipMetadata: IpMetadata | undefined

const getPublicIp = async (): Promise<IpMetadata> => {
    if (ipMetadata !== undefined) {
        return ipMetadata
    }

    dns.setServers([GOOGLE_DNS])

    const ipList = await dns.resolve(PUBLIC_IP_ADDRESS_QUERY, 'TXT')

    ipMetadata = {
        ip: ipList[0][0],
    }

    return ipMetadata
}

type IpMetadata = {
    ip: string
}

export const extractClientRealIp = (request: FastifyRequest): string => {
    return request.headers[CLIENT_REAL_IP_HEADER] as string
}

export const getServerUrl = async (): Promise<string> => {
    const environment = system.get(SystemProp.ENVIRONMENT)

    let url =
    environment === ApEnvironment.PRODUCTION
        ? system.get(SystemProp.FRONTEND_URL)!
        : system.get(SystemProp.WEBHOOK_URL)!

    // Localhost doesn't work with webhooks, so we need try to use the public ip
    if (
        extractHostname(url) == 'localhost' &&
    environment === ApEnvironment.PRODUCTION
    ) {
        url = `http://${(await getPublicIp()).ip}`
    }

    const slash = url.endsWith('/') ? '' : '/'
    const redirect = environment === ApEnvironment.PRODUCTION ? 'api/' : ''

    return `${url}${slash}${redirect}`
}

function extractHostname(url: string): string | null {
    try {
        const hostname = new URL(url).hostname
        return hostname
    }
    catch (e) {
        return null
    }
}
