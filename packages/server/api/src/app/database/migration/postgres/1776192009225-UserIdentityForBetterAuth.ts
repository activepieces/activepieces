import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class UserIdentityForBetterAuth1776192009225 implements Migration {
    name = 'UserIdentityForBetterAuth1776192009225'
    breaking = false
    transaction = false
    release = '0.81.3'

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query('alter table "user_identity" add column "name" character varying not null default \'\'')
        await queryRunner.query('alter table "user_identity" add column "image" character varying')
        await queryRunner.query('alter table "user_identity" add column "draft" boolean not null default false')

        await queryRunner.query('alter table "user_identity" alter column "password" drop not null')
        await queryRunner.query('alter table "user_identity" add column "emailVerified" boolean not null default false')

        // Backfill in batches to avoid locking the table for too long on large deployments
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

        await queryRunner.query(`
            alter table "user_identity" alter column "id" type character varying;
        `)

        await queryRunner.query('alter table "user_identity" rename column "created" to "createdAt"')
        await queryRunner.query('alter table "user_identity" rename column "updated" to "updatedAt"')

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

        // Migrate existing email/password users into the account table in batches
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('drop index if exists "verification_identifier_idx"')
        await queryRunner.query('drop index if exists "account_providerId_accountId_idx"')
        await queryRunner.query('drop index if exists "account_userId_idx"')
        await queryRunner.query('drop index if exists "session_userId_idx"')

        await queryRunner.query('drop table if exists "verification"')
        await queryRunner.query('drop table if exists "account"')
        await queryRunner.query('drop table if exists "session"')

        await queryRunner.query('alter table "user_identity" rename column "createdAt" to "created"')
        await queryRunner.query('alter table "user_identity" rename column "updatedAt" to "updated"')

        await queryRunner.query('alter table "user_identity" alter column "id" type character varying(21)')

        await queryRunner.query('alter table "user_identity" drop column if exists "emailVerified"')
        await queryRunner.query('UPDATE "user_identity" SET "password" = \'PLACEHOLDER\' WHERE "password" IS NULL') // just in case user_identity got created by betterauth and the syncing/provisioning after failed
        await queryRunner.query('alter table "user_identity" alter column "password" set not null')
        await queryRunner.query('alter table "user_identity" drop column if exists "draft"')
        await queryRunner.query('alter table "user_identity" drop column if exists "image"')
        await queryRunner.query('alter table "user_identity" drop column if exists "name"')
    }
}
