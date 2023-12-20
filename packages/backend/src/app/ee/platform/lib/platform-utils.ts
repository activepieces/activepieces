import { ApEdition, Principal } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { customDomainService } from '../../custom-domains/custom-domain.service'
import { getEdition } from '../../../helper/secret-helper'
import { platformService } from '../platform.service'

const edition = getEdition()

export const resolvePlatformIdForRequest = async (request: FastifyRequest): Promise<string | null> => {
    if (edition === ApEdition.COMMUNITY) {
        return getDefaultPlatformId()
    }

    return await extractPlatformIdFromAuthenticatedPrincipal(request.principal)
        ?? await getPlatformIdForHostname(request.hostname)
}
const extractPlatformIdFromAuthenticatedPrincipal = async (principal: Principal): Promise<string | null> => {
    return principal.platform?.id ?? getDefaultPlatformId()
}

const getPlatformIdForHostname = async (hostname: string): Promise<string | null> => {
    const customDomain = await customDomainService.getOneByDomain({ domain: hostname })
    return customDomain?.platformId ?? getDefaultPlatformId()
}


async function getDefaultPlatformId(): Promise<null | string> {
    if (edition === ApEdition.ENTERPRISE) {
        const platform = await platformService.getOldestPlatform()
        return platform?.id ?? null
    }
    return null
}