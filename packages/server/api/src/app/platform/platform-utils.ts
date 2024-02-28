import { ApEdition, Principal, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { customDomainService } from '../ee/custom-domains/custom-domain.service'
import { getEdition } from '../helper/secret-helper'
import { platformService } from './platform.service'
import { SystemProp, system } from 'server-shared'

const edition = getEdition()

export const resolvePlatformIdForRequest = async (
    request: FastifyRequest,
): Promise<string | null> => {
    return (
        (await extractPlatformIdFromAuthenticatedPrincipal(request.principal)) ??
    (await getPlatformIdForHostname(request.hostname))
    )
}
const extractPlatformIdFromAuthenticatedPrincipal = async (
    principal: Principal,
): Promise<string | null> => {
    if (principal.type === PrincipalType.UNKNOWN) {
        return null
    }
    return principal.platform.id ?? getDefaultPlatformId()
}

const getPlatformIdForHostname = async (
    hostname: string,
): Promise<string | null> => {
    if (edition === ApEdition.COMMUNITY) {
        return getDefaultPlatformId()
    }
    const customDomain = await customDomainService.getOneByDomain({
        domain: hostname,
    })
    return customDomain?.platformId ?? getDefaultPlatformId()
}

async function getDefaultPlatformId(): Promise<null | string> {
    if (edition === ApEdition.CLOUD) {
        return system.getOrThrow(SystemProp.CLOUD_PLATFORM_ID)
    }
    const platform = await platformService.getOldestPlatform()
    return platform?.id ?? null
}