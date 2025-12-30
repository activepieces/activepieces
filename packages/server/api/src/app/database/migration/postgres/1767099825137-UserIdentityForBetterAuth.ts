import { MigrationInterface, QueryRunner } from "typeorm";

export class UserIdentityForBetterAuth1767099825137 implements MigrationInterface {
    name = 'UserIdentityForBetterAuth1767099825137'

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
            alter table "user_identity" add column "name" character varying not null default '';
            alter table "user_identity" add column "image" character varying;
        `);
        await queryRunner.query(`
            alter table "user_identity" alter column "id" type character varying;
        `);
        await queryRunner.query(`
            alter table "user_identity" rename column "verified" to "emailVerified";

            alter table "user_identity" rename column "created" to "createdAt";

            alter table "user_identity" rename column "updated" to "updatedAt";
        `);
        await queryRunner.query(`
            ALTER TABLE "user_identity" DROP COLUMN "password"
        `);
        // await queryRunner.query(`
        //     ALTER TABLE "user_identity"
        //     ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        // `);
        // await queryRunner.query(`
        //     ALTER TABLE "user_identity"
        //     ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        // `);
        await queryRunner.query(`
            create table "session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user_identity" ("id") on delete cascade);
        `);

        await queryRunner.query(`
            create table "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user_identity" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);
        `);

        await queryRunner.query(`
            create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);
        `);

        await queryRunner.query(`
            create index "session_userId_idx" on "session" ("userId");
        `);

        await queryRunner.query(`
            create index "account_userId_idx" on "account" ("userId");
        `);

        await queryRunner.query(`
            create index "verification_identifier_idx" on "verification" ("identifier");
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`drop index if exists "verification_identifier_idx"`);
        await queryRunner.query(`drop index if exists "account_userId_idx"`);
        await queryRunner.query(`drop index if exists "session_userId_idx"`);

        await queryRunner.query(`drop table if exists "verification"`);
        await queryRunner.query(`drop table if exists "account"`);
        await queryRunner.query(`drop table if exists "session"`);

       
        await queryRunner.query(`alter table "user_identity" add column "password" character varying not null`);

        await queryRunner.query(`
            alter table "user_identity" rename column "emailVerified" to "verified";
        `);
        await queryRunner.query(`
            alter table "user_identity" rename column "createdAt" to "created";
        `);
        await queryRunner.query(`
            alter table "user_identity" rename column "updatedAt" to "updated";
        `);

        await queryRunner.query(`alter table "user_identity" alter column "id" type character varying(21)`);

        await queryRunner.query(`alter table "user_identity" drop column if exists "image"`);
        await queryRunner.query(`alter table "user_identity" drop column if exists "name"`);
    }

}
