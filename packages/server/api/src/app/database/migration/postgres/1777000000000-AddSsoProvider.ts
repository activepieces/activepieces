import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { Migration } from '../../migration'

export class AddSsoProvider1777000000000 implements Migration {
    name = 'AddSsoProvider1777000000000'
    breaking = false
    transaction = false
    release = '0.81.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ssoProvider" (
                "id"             TEXT NOT NULL PRIMARY KEY,
                "providerId"     TEXT NOT NULL UNIQUE,
                "issuer"         TEXT NOT NULL,
                "domain"         TEXT NOT NULL DEFAULT '',
                "oidcConfig"     TEXT,
                "samlConfig"     TEXT,
                "organizationId" TEXT,
                "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `)
        await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "ssoProvider_providerId_idx" ON "ssoProvider" ("providerId")')

        // Backfill existing platforms that already have Google credentials
        await queryRunner.query(`
            INSERT INTO "ssoProvider" ("id", "providerId", "issuer", "domain", "oidcConfig", "createdAt", "updatedAt")
            SELECT
                gen_random_uuid()::text,
                'google-' || p."id",
                'https://accounts.google.com',
                'platform-' || p."id",
                json_build_object(
                    'clientId',     p."federatedAuthProviders"->'google'->>'clientId',
                    'clientSecret', p."federatedAuthProviders"->'google'->>'clientSecret',
                    'scopes',       '["openid","email","profile"]'::json
                )::text,
                NOW(),
                NOW()
            FROM "platform" p
            WHERE p."federatedAuthProviders"->'google' IS NOT NULL
              AND p."federatedAuthProviders"->>'google' != 'null'
            ON CONFLICT ("providerId") DO NOTHING
        `)

        // Backfill existing platforms that already have SAML configured
        // Old SP used entityID='Activepieces' and idpCertificate as the SP privateKey
        // callbackUrl keeps the old ACS path so existing IdP configs don't need to change
        const frontendUrl = system.get(AppSystemProp.FRONTEND_URL) ?? ''
        const oldAcsUrl = `${frontendUrl}/api/v1/authn/saml/acs`
        await queryRunner.query(`
            INSERT INTO "ssoProvider" ("id", "providerId", "issuer", "domain", "samlConfig", "createdAt", "updatedAt")
            SELECT
                gen_random_uuid()::text,
                'saml-' || p."id",
                'Activepieces',
                'platform-' || p."id",
                json_build_object(
                    'issuer',      'Activepieces',
                    'entryPoint',  '',
                    'cert',        p."federatedAuthProviders"->'saml'->>'idpCertificate',
                    'callbackUrl', $1::text,
                    'idpMetadata', json_build_object(
                        'metadata', p."federatedAuthProviders"->'saml'->>'idpMetadata'
                    ),
                    'spMetadata',  json_build_object(
                        'entityID', 'Activepieces'
                    )
                )::text,
                NOW(),
                NOW()
            FROM "platform" p
            WHERE p."federatedAuthProviders"->'saml' IS NOT NULL
              AND p."federatedAuthProviders"->>'saml' != 'null'
            ON CONFLICT ("providerId") DO NOTHING
        `, [oldAcsUrl])
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "ssoProvider_providerId_idx"')
        await queryRunner.query('DROP TABLE IF EXISTS "ssoProvider"')
    }
}
