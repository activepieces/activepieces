import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGlobalConnectionsAndRbacForPlatformSqlite1731604290560 implements MigrationInterface {
    name = 'AddGlobalConnectionsAndRbacForPlatformSqlite1731604290560'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'up')
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
                "licenseKey" varchar,
                "smtp" text,
                "pinnedPieces" text NOT NULL,
                "globalConnectionsEnabled" boolean NOT NULL,
                "customRolesEnabled" boolean NOT NULL,
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
                    "analyticsEnabled",
                    "licenseKey",
                    "smtp",
                    "pinnedPieces",
                    "globalConnectionsEnabled",
                    "customRolesEnabled"
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
                "analyticsEnabled",
                "licenseKey",
                "smtp",
                "pinnedPieces",
                false as "globalConnectionsEnabled",
                false as "customRolesEnabled"
            FROM "platform"
        `)
        await queryRunner.query(`
            DROP TABLE "platform"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_platform"
                RENAME TO "platform"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'down')
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
                "licenseKey" varchar,
                "smtp" text,
                "pinnedPieces" text NOT NULL,
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
                    "analyticsEnabled",
                    "licenseKey",
                    "smtp",
                    "pinnedPieces"
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
                "analyticsEnabled",
                "licenseKey",
                "smtp",
                "pinnedPieces"
            FROM "temporary_platform"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_platform"
        `)
    }

}
