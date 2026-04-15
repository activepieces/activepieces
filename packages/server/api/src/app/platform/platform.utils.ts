import { ApEdition, isNil, PlatformId, PlatformWithoutSensitiveData, Principal, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { customDomainService } from '../ee/custom-domains/custom-domain.service'
import { system } from '../helper/system/system'
import { platformService } from './platform.service'


type Request = {
    principal?: Principal
    headers?: {
        host?: string
    }
    log: FastifyBaseLogger
}

export const platformUtils = {
    async getPlatformIdForRequest(req: Request): Promise<PlatformId | null> {
        if (req.principal && req.principal.type !== PrincipalType.UNKNOWN && req.principal.type !== PrincipalType.WORKER) {
            return req.principal.platform.id
        }
        if (!isNil(req.headers?.host)) {
            const platformIdFromHostName = await getPlatformIdForHostname(req.headers.host)
            if (!isNil(platformIdFromHostName)) {
                return platformIdFromHostName
            }
        }
        if (system.getEdition() === ApEdition.CLOUD) {
            return null
        }
        const oldestPlatform = await platformService(req.log).getOldestPlatform()
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
