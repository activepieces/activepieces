import dns from 'node:dns/promises'
import { FastifyRequest } from 'fastify'

const GOOGLE_DNS = '216.239.32.10'
const PUBLIC_IP_ADDRESS_QUERY = 'o-o.myaddr.l.google.com'


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


const extractClientRealIp = (request: FastifyRequest, clientIpHeader: string): string => {
    return request.headers[clientIpHeader] as string
}



export const networkUtls = {
    extractClientRealIp,
    getPublicIp,
}