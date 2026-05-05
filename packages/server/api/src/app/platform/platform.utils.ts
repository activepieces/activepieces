import { ApEdition, isNil, PlatformId, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { databaseConnection } from '../database/database-connection'
import { system } from '../helper/system/system'
import { platformService } from './platform.service'

export const platformUtils = {
    async getPlatformIdForRequest(req: FastifyRequest): Promise<PlatformId | null> {
        if (req.principal && req.principal.type !== PrincipalType.UNKNOWN && req.principal.type !== PrincipalType.WORKER) {
            return req.principal.platform.id
        }
        if (system.getEdition() === ApEdition.CLOUD) {
            return null
        }
        const oldestPlatform = await platformService(req.log).getOldestPlatform()
        return oldestPlatform?.id ?? null
    },

    // temporary helper for sso customers until they update the acs url in saml
    async getPlatformIdByLegacyHost(host: string | undefined | null): Promise<PlatformId | null> {
        if (isNil(host) || host.length === 0) {
            return null
        }
        const rows = await databaseConnection().query<Array<{ platform_id: string }>>(
            'SELECT platform_id FROM legacy_custom_domain WHERE domain = $1 LIMIT 1',
            [host.toLowerCase()],
        )
        return rows[0]?.platform_id ?? null
    },
}
