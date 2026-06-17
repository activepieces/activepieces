import { ApEdition, isNil, PlatformId, PrincipalType, tryCatch } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { databaseConnection } from '../database/database-connection'
import { networkUtils } from '../helper/network-utils'
import { system } from '../helper/system/system'
import { platformService } from './platform.service'

export const platformUtils = {
    async getPlatformIdForRequest(req: FastifyRequest): Promise<PlatformId | null> {
        if (
            req.principal
            && req.principal.type !== PrincipalType.UNKNOWN
            && req.principal.type !== PrincipalType.WORKER
            && req.principal.type !== PrincipalType.ONBOARDING
        ) {
            return req.principal.platform.id
        }
        if (system.getEdition() === ApEdition.CLOUD) {
            return null
        }
        const oldestPlatform = await platformService(req.log).getOldestPlatform()
        return oldestPlatform?.id ?? null
    },

    // temporary helper for sso customers until they update the acs url in saml
    async getPlatformIdByLegacyHost(req: FastifyRequest): Promise<PlatformId | null> {
        const host = networkUtils.getRequestHost(req)
        if (isNil(host) || host.length === 0) {
            return null
        }
        const { data, error } =  await tryCatch(() => databaseConnection().query<Array<{ platform_id: string }>>(
            'SELECT platform_id FROM legacy_custom_domain WHERE domain = $1 LIMIT 1',
            [host.toLowerCase()],
        ))
        if (error) return null
        return data[0]?.platform_id ?? null
    },
    async getLegacyHostByPlatformId(platformId: string): Promise<string | null> {
        const { data, error } =  await tryCatch(() => databaseConnection().query<Array<{ domain: string }>>(
            'SELECT domain FROM legacy_custom_domain WHERE platform_id = $1 LIMIT 1',
            [platformId],
        ))
        if (error) return null
        return data[0]?.domain ?? null
    },
}
