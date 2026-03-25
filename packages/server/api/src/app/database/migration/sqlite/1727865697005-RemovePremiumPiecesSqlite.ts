import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemovePremiumPiecesSqlite1727865697005 implements MigrationInterface {
    name = 'RemovePremiumPiecesSqlite1727865697005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "password" varchar NOT NULL,
                "status" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "externalId" varchar,
                "platformId" varchar,
                "verified" boolean NOT NULL,
                "platformRole" varchar NOT NULL,
                "tokenVersion" character varying
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_user"(
                    "id",
                    "created",
                    "updated",
                    "email",
                    "firstName",
                    "lastName",
                    "password",
                    "status",
                    "trackEvents",
                    "newsLetter",
                    "externalId",
                    "platformId",
                    "verified",
                    "platformRole",
                    "tokenVersion"
                )
            SELECT "id",
                "created",
                "updated",
                "email",
                "firstName",
                "lastName",
                "password",
                "status",
                "trackEvents",
                "newsLetter",
                "externalId",
                "platformId",
                "verified",
                "platformRole",
                "tokenVersion"
            FROM "user"
        `)
        await queryRunner.query(`
            DROP TABLE "user"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_user"
                RENAME TO "user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_platform" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "name" varchar NOT NULL,
                "primaryColor" varchar NOT NULL,
                "logoIconUrl" varchar NOT NULL,
                "fullLogoUrl" varchar NOT NULL,
                "favIconUrl" varchar NOT NULL,
                "smtpHost" varchar,
                "smtpPort" integer,
                "smtpUser" varchar,
                "smtpPassword" varchar,
                "smtpSenderEmail" varchar,
                "smtpUseSSL" boolean,
                "privacyPolicyUrl" varchar,
                "termsOfServiceUrl" varchar,
                "showPoweredBy" boolean NOT NULL,
                "cloudAuthEnabled" boolean NOT NULL DEFAULT (1),
                "embeddingEnabled" boolean NOT NULL DEFAULT (1),
                "filteredPieceNames" text NOT NULL,
                "filteredPieceBehavior" varchar CHECK(
                    "filteredPieceBehavior" IN ('ALLOWED', 'BLOCKED')
                ) NOT NULL,
                "gitSyncEnabled" boolean NOT NULL,
                "defaultLocale" varchar CHECK(
                    "defaultLocale" IN (
                        'nl',
                        'en',
                        'de',
                        'it',
                        'fr',
                        'bg',
                        'uk',
                        'hu',
                        'es',
                        'ja',
                        'id',
                        'vi',
                        'zh',
                        'pt'
                    )
                ),
                "allowedAuthDomains" text NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" text NOT NULL,
                "auditLogEnabled" boolean NOT NULL,
                "customAppearanceEnabled" boolean NOT NULL,
                "manageProjectsEnabled" boolean NOT NULL,
                "managePiecesEnabled" boolean NOT NULL,
                "manageTemplatesEnabled" boolean NOT NULL,
                "apiKeysEnabled" boolean NOT NULL,
                "projectRolesEnabled" boolean NOT NULL,
                "customDomainsEnabled" boolean NOT NULL,
                "flowIssuesEnabled" boolean NOT NULL,
                "alertsEnabled" boolean NOT NULL,
                "analyticsEnabled" boolean NOT NULL,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId"),
                CONSTRAINT "fk_platform_user" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_platform"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "name",
                    "primaryColor",
                    "logoIconUrl",
                    "fullLogoUrl",
                    "favIconUrl",
                    "smtpHost",
                    "smtpPort",
                    "smtpUser",
                    "smtpPassword",
                    "smtpSenderEmail",
                    "smtpUseSSL",
                    "privacyPolicyUrl",
                    "termsOfServiceUrl",
                    "showPoweredBy",
                    "cloudAuthEnabled",
                    "embeddingEnabled",
                    "filteredPieceNames",
                    "filteredPieceBehavior",
                    "gitSyncEnabled",
                    "defaultLocale",
                    "allowedAuthDomains",
                    "enforceAllowedAuthDomains",
                    "ssoEnabled",
                    "emailAuthEnabled",
                    "federatedAuthProviders",
                    "auditLogEnabled",
                    "customAppearanceEnabled",
                    "manageProjectsEnabled",
                    "managePiecesEnabled",
                    "manageTemplatesEnabled",
                    "apiKeysEnabled",
                    "projectRolesEnabled",
                    "customDomainsEnabled",
                    "flowIssuesEnabled",
                    "alertsEnabled",
                    "analyticsEnabled"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "name",
                "primaryColor",
                "logoIconUrl",
                "fullLogoUrl",
                "favIconUrl",
                "smtpHost",
                "smtpPort",
                "smtpUser",
                "smtpPassword",
                "smtpSenderEmail",
                "smtpUseSSL",
                "privacyPolicyUrl",
                "termsOfServiceUrl",
                "showPoweredBy",
                "cloudAuthEnabled",
                "embeddingEnabled",
                "filteredPieceNames",
                "filteredPieceBehavior",
                "gitSyncEnabled",
                "defaultLocale",
                "allowedAuthDomains",
                "enforceAllowedAuthDomains",
                "ssoEnabled",
                "emailAuthEnabled",
                "federatedAuthProviders",
                "auditLogEnabled",
                "customAppearanceEnabled",
                "manageProjectsEnabled",
                "managePiecesEnabled",
                "manageTemplatesEnabled",
                "apiKeysEnabled",
                "projectRolesEnabled",
                "customDomainsEnabled",
                "flowIssuesEnabled",
                "alertsEnabled",
                "analyticsEnabled"
            FROM "platform"
        `)
        await queryRunner.query(`
            DROP TABLE "platform"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_platform"
                RENAME TO "platform"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "password" varchar NOT NULL,
                "status" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "externalId" varchar,
                "platformId" varchar,
                "verified" boolean NOT NULL,
                "platformRole" varchar NOT NULL,
                "tokenVersion" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_user"(
                    "id",
                    "created",
                    "updated",
                    "email",
                    "firstName",
                    "lastName",
                    "password",
                    "status",
                    "trackEvents",
                    "newsLetter",
                    "externalId",
                    "platformId",
                    "verified",
                    "platformRole",
                    "tokenVersion"
                )
            SELECT "id",
                "created",
                "updated",
                "email",
                "firstName",
                "lastName",
                "password",
                "status",
                "trackEvents",
                "newsLetter",
                "externalId",
                "platformId",
                "verified",
                "platformRole",
                "tokenVersion"
            FROM "user"
        `)
        await queryRunner.query(`
            DROP TABLE "user"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_user"
                RENAME TO "user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
                RENAME TO "temporary_user"
        `)
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "password" varchar NOT NULL,
                "status" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "externalId" varchar,
                "platformId" varchar,
                "verified" boolean NOT NULL,
                "platformRole" varchar NOT NULL,
                "tokenVersion" character varying
            )
        `)
        await queryRunner.query(`
            INSERT INTO "user"(
                    "id",
                    "created",
                    "updated",
                    "email",
                    "firstName",
                    "lastName",
                    "password",
                    "status",
                    "trackEvents",
                    "newsLetter",
                    "externalId",
                    "platformId",
                    "verified",
                    "platformRole",
                    "tokenVersion"
                )
            SELECT "id",
                "created",
                "updated",
                "email",
                "firstName",
                "lastName",
                "password",
                "status",
                "trackEvents",
                "newsLetter",
                "externalId",
                "platformId",
                "verified",
                "platformRole",
                "tokenVersion"
            FROM "temporary_user"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
                RENAME TO "temporary_platform"
        `)
        await queryRunner.query(`
            CREATE TABLE "platform" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "name" varchar NOT NULL,
                "primaryColor" varchar NOT NULL,
                "logoIconUrl" varchar NOT NULL,
                "fullLogoUrl" varchar NOT NULL,
                "favIconUrl" varchar NOT NULL,
                "smtpHost" varchar,
                "smtpPort" integer,
                "smtpUser" varchar,
                "smtpPassword" varchar,
                "smtpSenderEmail" varchar,
                "smtpUseSSL" boolean,
                "privacyPolicyUrl" varchar,
                "termsOfServiceUrl" varchar,
                "showPoweredBy" boolean NOT NULL,
                "cloudAuthEnabled" boolean NOT NULL DEFAULT (1),
                "embeddingEnabled" boolean NOT NULL DEFAULT (1),
                "filteredPieceNames" text NOT NULL,
                "filteredPieceBehavior" varchar CHECK(
                    "filteredPieceBehavior" IN ('ALLOWED', 'BLOCKED')
                ) NOT NULL,
                "gitSyncEnabled" boolean NOT NULL,
                "defaultLocale" varchar CHECK(
                    "defaultLocale" IN (
                        'nl',
                        'en',
                        'de',
                        'it',
                        'fr',
                        'bg',
                        'uk',
                        'hu',
                        'es',
                        'ja',
                        'id',
                        'vi',
                        'zh',
                        'pt'
                    )
                ),
                "allowedAuthDomains" text NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" text NOT NULL,
                "auditLogEnabled" boolean NOT NULL,
                "customAppearanceEnabled" boolean NOT NULL,
                "manageProjectsEnabled" boolean NOT NULL,
                "managePiecesEnabled" boolean NOT NULL,
                "manageTemplatesEnabled" boolean NOT NULL,
                "apiKeysEnabled" boolean NOT NULL,
                "projectRolesEnabled" boolean NOT NULL,
                "customDomainsEnabled" boolean NOT NULL,
                "flowIssuesEnabled" boolean NOT NULL,
                "alertsEnabled" boolean NOT NULL,
                "premiumPieces" text NOT NULL,
                "analyticsEnabled" boolean NOT NULL,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId"),
                CONSTRAINT "fk_platform_user" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `)
        await queryRunner.query(`
            INSERT INTO "platform"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "name",
                    "primaryColor",
                    "logoIconUrl",
                    "fullLogoUrl",
                    "favIconUrl",
                    "smtpHost",
                    "smtpPort",
                    "smtpUser",
                    "smtpPassword",
                    "smtpSenderEmail",
                    "smtpUseSSL",
                    "privacyPolicyUrl",
                    "termsOfServiceUrl",
                    "showPoweredBy",
                    "cloudAuthEnabled",
                    "embeddingEnabled",
                    "filteredPieceNames",
                    "filteredPieceBehavior",
                    "gitSyncEnabled",
                    "defaultLocale",
                    "allowedAuthDomains",
                    "enforceAllowedAuthDomains",
                    "ssoEnabled",
                    "emailAuthEnabled",
                    "federatedAuthProviders",
                    "auditLogEnabled",
                    "customAppearanceEnabled",
                    "manageProjectsEnabled",
                    "managePiecesEnabled",
                    "manageTemplatesEnabled",
                    "apiKeysEnabled",
                    "projectRolesEnabled",
                    "customDomainsEnabled",
                    "flowIssuesEnabled",
                    "alertsEnabled",
                    "analyticsEnabled"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "name",
                "primaryColor",
                "logoIconUrl",
                "fullLogoUrl",
                "favIconUrl",
                "smtpHost",
                "smtpPort",
                "smtpUser",
                "smtpPassword",
                "smtpSenderEmail",
                "smtpUseSSL",
                "privacyPolicyUrl",
                "termsOfServiceUrl",
                "showPoweredBy",
                "cloudAuthEnabled",
                "embeddingEnabled",
                "filteredPieceNames",
                "filteredPieceBehavior",
                "gitSyncEnabled",
                "defaultLocale",
                "allowedAuthDomains",
                "enforceAllowedAuthDomains",
                "ssoEnabled",
                "emailAuthEnabled",
                "federatedAuthProviders",
                "auditLogEnabled",
                "customAppearanceEnabled",
                "manageProjectsEnabled",
                "managePiecesEnabled",
                "manageTemplatesEnabled",
                "apiKeysEnabled",
                "projectRolesEnabled",
                "customDomainsEnabled",
                "flowIssuesEnabled",
                "alertsEnabled",
                "analyticsEnabled"
            FROM "temporary_platform"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_platform"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
                RENAME TO "temporary_user"
        `)
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "password" varchar NOT NULL,
                "status" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "externalId" varchar,
                "platformId" varchar,
                "verified" boolean NOT NULL,
                "platformRole" varchar NOT NULL,
                "tokenVersion" character varying
            )
        `)
        await queryRunner.query(`
            INSERT INTO "user"(
                    "id",
                    "created",
                    "updated",
                    "email",
                    "firstName",
                    "lastName",
                    "password",
                    "status",
                    "trackEvents",
                    "newsLetter",
                    "externalId",
                    "platformId",
                    "verified",
                    "platformRole",
                    "tokenVersion"
                )
            SELECT "id",
                "created",
                "updated",
                "email",
                "firstName",
                "lastName",
                "password",
                "status",
                "trackEvents",
                "newsLetter",
                "externalId",
                "platformId",
                "verified",
                "platformRole",
                "tokenVersion"
            FROM "temporary_user"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
    }

}
