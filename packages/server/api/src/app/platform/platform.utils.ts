import { ApEdition, isNil, PlatformId, PlatformWithoutSensitiveData, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { system } from '../helper/system/system'
import { platformService } from './platform.service'

export const platformUtils = {
    async getPlatformIdForRequest(req: FastifyRequest): Promise<PlatformId | null> {
        if (req.principal && req.principal.type !== PrincipalType.UNKNOWN && req.principal.type !== PrincipalType.WORKER) {
            return req.principal.platform.id
        }
        // Custom domains functionality removed (EE feature)
        if (system.getEdition() === ApEdition.CLOUD) {
            return null
        }
        const oldestPlatform = await platformService.getOldestPlatform()
        return oldestPlatform?.id ?? null
    },
    isCustomerOnDedicatedDomain(_platform: PlatformWithoutSensitiveData): boolean {
        // Custom domains functionality removed (EE feature)
        return false
    },
}

