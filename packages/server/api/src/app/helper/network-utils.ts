import dns from 'node:dns/promises'
import os from 'os'
import { isNil } from '@activepieces/shared'
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

const extractClientRealIp = (request: FastifyRequest, clientIpHeader: string | undefined): string => {
    if (isNil(clientIpHeader)) {
        return request.ip
    }
    return request.headers[clientIpHeader] as string
}

const getRequestHost = (req: FastifyRequest): string => {
    // in Cloud edition custom hostnames x-forwareded-host will be the original custom hostname while req.hostname will be our main cloud hostname
    const xfh = req.headers['x-forwarded-host']
    const forwardedHost = (Array.isArray(xfh) ? xfh[0] : xfh)?.split(',')[0]?.trim()
    return forwardedHost ?? req.hostname
}

const getRequestBaseUrl = (req: FastifyRequest): string => {
    const forwardedProto = req.headers['x-forwarded-proto'] as string | undefined
    const protocol = forwardedProto?.split(',')[0]?.trim() ?? req.protocol
    return `${protocol}://${getRequestHost(req)}`
}

export const networkUtils = {
    extractClientRealIp,
    getPublicIp,
    getRequestHost,
    getRequestBaseUrl,
    combineUrl(url: string, path: string) {
        const cleanedUrl = cleanTrailingSlash(url)
        const cleanedPath = cleanLeadingSlash(path)
        return `${cleanedUrl}/${cleanedPath}`
    },
}

function cleanLeadingSlash(url: string): string {
    return url.startsWith('/') ? url.slice(1) : url
}

function cleanTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url
}
