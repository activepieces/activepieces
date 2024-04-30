import { FastifyRequest } from 'fastify'
import { customDomainService } from '../ee/custom-domains/custom-domain.service'
import { getEdition } from '../helper/secret-helper'
import { userService } from '../user/user-service'
import { platformService } from './platform.service'
import { system, SystemProp } from '@activepieces/server-shared'
import { ApEdition, Principal, PrincipalType } from '@activepieces/shared'

const edition = getEdition()


export const resolvePlatformIdFromEmail = async (
    platformId: string | null,
    userEmail: string,
): Promise<string | null> => {
    const shouldResolve = getEdition() === ApEdition.COMMUNITY
    if (!shouldResolve) {
        return platformId
    }
    const users = await userService.getUsersByEmail({ email: userEmail })
    if (users.length === 1) {
        return users[0].platformId
    }
    return platformId
}

export const resolvePlatformIdForAuthnRequest = async (
    userEmail: string,
    request: FastifyRequest,
): Promise<string | null> => {
    const platformId = await resolvePlatformIdForRequest(request)
    return resolvePlatformIdFromEmail(platformId, userEmail)
}

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
