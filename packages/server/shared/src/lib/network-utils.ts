import dns from 'node:dns/promises'
import os from 'os'
import { ApEnvironment, isNil } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'

const GOOGLE_DNS = '216.239.32.10'
const PUBLIC_IP_ADDRESS_QUERY = 'o-o.myaddr.l.google.com'


type IpMetadata = {
    ip: string
}

let ipMetadata: IpMetadata | undefined

const getLocalIp = (): string | null => {
    const networkInterfaces = os.networkInterfaces()
    for (const interfaceName of Object.keys(networkInterfaces)) {
        const networkInterface = networkInterfaces[interfaceName]
        if (networkInterface) {
            for (const iface of networkInterface) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address
                }
            }
        }
    }
    return null
}

const getPublicIp = async (): Promise<IpMetadata> => {
    if (ipMetadata !== undefined) {
        return ipMetadata
    }

    try {
        dns.setServers([GOOGLE_DNS])

        const ipList = await dns.resolve(PUBLIC_IP_ADDRESS_QUERY, 'TXT')

        ipMetadata = {
            ip: ipList[0][0],
        }

        return ipMetadata
    }
    catch (error) {
        const localIp = getLocalIp()
        if (localIp) {
            ipMetadata = {
                ip: localIp,
            }
            return ipMetadata
        }
        throw error
    }
}

const getPublicUrl = async (environment: ApEnvironment, frontendUrl: string): Promise<string> => {
    let url = frontendUrl

    if (extractHostname(url) === 'localhost' && environment === ApEnvironment.PRODUCTION) {
        url = `http://${(await networkUtls.getPublicIp()).ip}`
    }

    return appendSlashAndApi(url)
}


const extractClientRealIp = (request: FastifyRequest, clientIpHeader: string | undefined): string => {
    if (isNil(clientIpHeader)) {
        return request.ip
    }
    return request.headers[clientIpHeader] as string
}



export const networkUtls = {
    extractClientRealIp,
    getPublicIp,
    getPublicUrl,
}

const appendSlashAndApi = (url: string): string => {
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