import { Principal } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { customDomainService } from '../../custom-domains/custom-domain.service'

export const resolvePlatformIdForRequest = async (request: FastifyRequest): Promise<string | null> => {
    return extractPlatformIdFromAuthenticatedPrincipal(request.principal)
        ?? await getPlatformIdForHostname(request.hostname)
}

export const extractPlatformIdFromAuthenticatedPrincipal = (principal: Principal): string | null => {
    return principal.platform?.id ?? null
}

export const getPlatformIdForHostname = async (hostname: string): Promise<string | null> => {
    const customDomain = await customDomainService.getOneByDomain({ domain: hostname })
    return customDomain?.platformId ?? null
}
