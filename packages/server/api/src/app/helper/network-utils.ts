import dns from 'node:dns/promises'
import os from 'os'
import { isNil, tryCatchSync } from '@activepieces/core-utils'
import { FastifyRequest } from 'fastify'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

const GOOGLE_DNS = '216.239.32.10'
const HOST_RESTRUCTURING_CHARACTERS = /[^A-Za-z0-9._\-:[\]]/
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

const clientIp = (request: FastifyRequest): string => {
    return extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER))
}

const firstForwardedValue = (header: string | string[] | undefined): string | undefined => {
    return (Array.isArray(header) ? header[0] : header)?.split(',')[0]?.trim()
}

const getRequestHost = (req: FastifyRequest): string => {
    // in Cloud edition custom hostnames x-forwareded-host will be the original custom hostname while req.hostname will be our main cloud hostname
    const forwardedHost = firstForwardedValue(req.headers['x-forwarded-host'])
    if (isNil(forwardedHost) || forwardedHost === '' || HOST_RESTRUCTURING_CHARACTERS.test(forwardedHost)) {
        return req.hostname
    }
    return forwardedHost
}

const getRequestBaseUrl = (req: FastifyRequest): string => {
    const forwardedProto = firstForwardedValue(req.headers['x-forwarded-proto'])
    const protocol = forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : req.protocol
    const baseUrl = `${protocol}://${getRequestHost(req)}`
    if (tryCatchSync(() => new URL(baseUrl)).error) {
        return `${req.protocol}://${req.hostname}`
    }
    return baseUrl
}

export const networkUtils = {
    extractClientRealIp,
    clientIp,
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
