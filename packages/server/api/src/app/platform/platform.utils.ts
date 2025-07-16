import { ApEdition, isNil, PlatformId, PlatformWithoutSensitiveData, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { customDomainService } from '../ee/custom-domains/custom-domain.service'
import { system } from '../helper/system/system'
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
            return null
        }
        const oldestPlatform = await platformService.getOldestPlatform()
        return oldestPlatform?.id ?? null
    },
    isCustomerOnDedicatedDomain(platform: PlatformWithoutSensitiveData): boolean {
        const edition = system.getEdition()
        if (edition !== ApEdition.CLOUD) {
            return false
        }
        return platform.plan.customDomainsEnabled
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
