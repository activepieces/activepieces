import dns from 'node:dns/promises'
import { ApEnvironment } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'

const GOOGLE_DNS = '216.239.32.10'
const PUBLIC_IP_ADDRESS_QUERY = 'o-o.myaddr.l.google.com'
const CLIENT_REAL_IP_HEADER = system.getOrThrow(
    SystemProp.CLIENT_REAL_IP_HEADER,
)

type IpMetadata = {
    ip: string
}

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


const extractClientRealIp = (request: FastifyRequest): string => {
    return request.headers[CLIENT_REAL_IP_HEADER] as string
}

const getApiUrl = async (): Promise<string> => {
    const environment = system.getOrThrow<ApEnvironment>(SystemProp.ENVIRONMENT)
    let url = system.getOrThrow(SystemProp.FRONTEND_URL)
    if (extractHostname(url) == 'localhost' && environment === ApEnvironment.PRODUCTION) {
        url = `http://${(await getPublicIp()).ip}`
    }
    const slash = url.endsWith('/') ? '' : '/'
    return `${url}${slash}api/`
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

export const networkUtls = {
    getApiUrl,
    extractClientRealIp,
    getPublicIp,
}