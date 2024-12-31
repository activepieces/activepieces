

import { ApEdition, isNil, PlatformId, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { customDomainService } from '../ee/custom-domains/custom-domain.service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-prop'
import { platformService } from './platform.service'

export const platformUtils = {
    async getPlatformIdForRequest(req: FastifyRequest): Promise<PlatformId | null> {
        if (req.principal.type !== PrincipalType.UNKNOWN) {
            return req.principal.platform.id
        }
        const platformIdFromHostName = await getPlatformIdForHostname(req.headers.host as string)
        if (!isNil(platformIdFromHostName)) {
            return platformIdFromHostName
        }
        if (system.getEdition() === ApEdition.CLOUD) {
            return system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        }
        const oldestPlatform = await platformService.getOldestPlatform()
        return oldestPlatform?.id ?? null
    },
}
const getPlatformIdForHostname = async (
    hostname: string,
): Promise<string | null> => {
    if (system.getEdition() === ApEdition.COMMUNITY) {
        return null
    }
    const customDomain = await customDomainService.getOneByDomain({
        domain: hostname,
    })
    return customDomain?.platformId ?? null
}
