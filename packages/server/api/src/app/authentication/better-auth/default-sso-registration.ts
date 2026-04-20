import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { databaseConnection } from '../../database/database-connection'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

export async function registerDefaultSsoProviders(log: FastifyBaseLogger): Promise<void> {
    const clientId = system.get(AppSystemProp.GOOGLE_CLIENT_ID)
    const clientSecret = system.get(AppSystemProp.GOOGLE_CLIENT_SECRET)

    if (isNil(clientId) || isNil(clientSecret)) {
        log.info('[registerDefaultSsoProviders] AP_GOOGLE_CLIENT_ID or AP_GOOGLE_CLIENT_SECRET not set, skipping default Google SSO registration')
        return
    }

    const oidcConfig = JSON.stringify({
        clientId,
        clientSecret,
        scopes: ['openid', 'email', 'profile'],
    })

    await databaseConnection().query(`
        INSERT INTO "ssoProvider" ("id", "providerId", "issuer", "domain", "oidcConfig", "createdAt", "updatedAt")
        VALUES ($1, 'google-default', 'https://accounts.google.com', '', $2, NOW(), NOW())
        ON CONFLICT ("providerId") DO UPDATE
            SET "oidcConfig"  = EXCLUDED."oidcConfig",
                "updatedAt"   = NOW()
    `, [nanoid(), oidcConfig])

    log.info('[registerDefaultSsoProviders] Default Google SSO provider registered/updated')
}
