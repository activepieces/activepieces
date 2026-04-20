import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { Migration } from '../../migration'

export class BetterAuth1776192009225 implements Migration {
    name = 'BetterAuth1776192009225'
    breaking = false
    transaction = false
    release = '0.81.3'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // ── user_identity schema changes ──────────────────────────────────
        await queryRunner.query('alter table "user_identity" add column "name" character varying not null default \'\'')
        await queryRunner.query('alter table "user_identity" add column "image" character varying')
        await queryRunner.query('alter table "user_identity" add column "draft" boolean not null default false')

        await queryRunner.query('alter table "user_identity" alter column "password" drop not null')
        await queryRunner.query('alter table "user_identity" add column "emailVerified" boolean not null default false')

        await queryRunner.query(`
            do $$
            declare
                batch_size int := 1000;
                updated int;
            begin
                loop
                    update "user_identity"
                    set "emailVerified" = "verified"
                    where id in (
                        select id from "user_identity"
                        where "emailVerified" is distinct from "verified"
                        limit batch_size
                    );
                    get diagnostics updated = row_count;
                    exit when updated = 0;
                end loop;
            end $$
        `)

        await queryRunner.query('alter table "user_identity" alter column "id" type character varying')
        await queryRunner.query('alter table "user_identity" rename column "created" to "createdAt"')
        await queryRunner.query('alter table "user_identity" rename column "updated" to "updatedAt"')
        await queryRunner.query('ALTER TABLE "user_identity" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT FALSE')

        // ── better-auth core tables ───────────────────────────────────────
        await queryRunner.query(`
            create table "session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user_identity" ("id") on delete cascade);
        `)

        await queryRunner.query(`
            create table "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user_identity" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);
        `)

        await queryRunner.query(`
            create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);
        `)

        await queryRunner.query('create index "session_userId_idx" on "session" ("userId")')
        await queryRunner.query('create index "account_userId_idx" on "account" ("userId")')
        await queryRunner.query('create index "account_providerId_accountId_idx" on "account" ("providerId", "accountId")')
        await queryRunner.query('create index "verification_identifier_idx" on "verification" ("identifier")')

        // ── backfill email/password users into account table ──────────────
        await queryRunner.query(`
            do $$
            declare
                batch_size int := 1000;
                last_id text := '';
                inserted int;
            begin
                loop
                    insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
                    select
                        gen_random_uuid()::text,
                        "email",
                        'credential',
                        "id",
                        "password",
                        now(),
                        now()
                    from "user_identity"
                    where "provider" = 'EMAIL'
                    and "password" is not null
                    and "id" > last_id
                    order by "id"
                    limit batch_size;
                    get diagnostics inserted = row_count;
                    exit when inserted = 0;
                    select max("userId") into last_id from "account" where "providerId" = 'credential';
                end loop;
            end $$
        `)

        // Migrate existing Google users — accountId is set to their email as a placeholder since we don't store
        // the Google subject ID. Better-auth will update it with the real subject ID on next Google sign-in.
        await queryRunner.query(`
            do $$
            declare
                batch_size int := 1000;
                last_id text := '';
                inserted int;
            begin
                loop
                    insert into "account" ("id", "accountId", "providerId", "userId", "createdAt", "updatedAt")
                    select
                        gen_random_uuid()::text,
                        "email",
                        'google',
                        "id",
                        now(),
                        now()
                    from "user_identity"
                    where "provider" = 'GOOGLE'
                    and "id" > last_id
                    order by "id"
                    limit batch_size;
                    get diagnostics inserted = row_count;
                    exit when inserted = 0;
                    select max("userId") into last_id from "account" where "providerId" = 'google';
                end loop;
            end $$
        `)

        // ── two-factor table ──────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "twoFactor" (
                "id" TEXT PRIMARY KEY,
                "secret" TEXT NOT NULL,
                "backupCodes" TEXT NOT NULL,
                "userId" TEXT NOT NULL REFERENCES "user_identity"("id") ON DELETE CASCADE,
                "verified" BOOLEAN NOT NULL DEFAULT FALSE,
                "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `)
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "twoFactor_userId_idx" ON "twoFactor" ("userId")')

        await queryRunner.query('ALTER TABLE "platform" ADD COLUMN IF NOT EXISTS "enforceTotp" BOOLEAN NOT NULL DEFAULT FALSE')

        // ── SSO provider table ────────────────────────────────────────────
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
                    ),
                    'mapping', json_build_object(
                        'email',     'email',
                        'firstName', 'firstName',
                        'lastName',  'lastName'
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
        // ── SSO provider ──────────────────────────────────────────────────
        await queryRunner.query('DROP INDEX IF EXISTS "ssoProvider_providerId_idx"')
        await queryRunner.query('DROP TABLE IF EXISTS "ssoProvider"')

        // ── two-factor ────────────────────────────────────────────────────
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "enforceTotp"')
        await queryRunner.query('DROP INDEX IF EXISTS "twoFactor_userId_idx"')
        await queryRunner.query('DROP TABLE IF EXISTS "twoFactor"')

        // ── better-auth core tables ───────────────────────────────────────
        await queryRunner.query('drop index if exists "verification_identifier_idx"')
        await queryRunner.query('drop index if exists "account_providerId_accountId_idx"')
        await queryRunner.query('drop index if exists "account_userId_idx"')
        await queryRunner.query('drop index if exists "session_userId_idx"')

        await queryRunner.query('drop table if exists "verification"')
        await queryRunner.query('drop table if exists "account"')
        await queryRunner.query('drop table if exists "session"')

        // ── user_identity schema rollback ─────────────────────────────────
        await queryRunner.query('ALTER TABLE "user_identity" DROP COLUMN IF EXISTS "twoFactorEnabled"')
        await queryRunner.query('alter table "user_identity" rename column "createdAt" to "created"')
        await queryRunner.query('alter table "user_identity" rename column "updatedAt" to "updated"')
        await queryRunner.query('alter table "user_identity" alter column "id" type character varying(21)')
        await queryRunner.query('alter table "user_identity" drop column if exists "emailVerified"')
        await queryRunner.query('UPDATE "user_identity" SET "password" = \'PLACEHOLDER\' WHERE "password" IS NULL')
        await queryRunner.query('alter table "user_identity" alter column "password" set not null')
        await queryRunner.query('alter table "user_identity" drop column if exists "draft"')
        await queryRunner.query('alter table "user_identity" drop column if exists "image"')
        await queryRunner.query('alter table "user_identity" drop column if exists "name"')
    }
}
