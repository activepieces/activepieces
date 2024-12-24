import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectReleasesSqlite1735047025034 implements MigrationInterface {
    name = 'ProjectReleasesSqlite1735047025034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_worker_machine" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21),
                "type" varchar NOT NULL,
                "information" text NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_worker_machine"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "type",
                    "information"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "information"
            FROM "worker_machine"
        `);
        await queryRunner.query(`
            DROP TABLE "worker_machine"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_worker_machine"
                RENAME TO "worker_machine"
        `);
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
        `);
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
            FROM "platform"
        `);
        await queryRunner.query(`
            DROP TABLE "platform"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_platform"
                RENAME TO "platform"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_worker_machine" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "information" text NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_worker_machine"("id", "created", "updated", "information")
            SELECT "id",
                "created",
                "updated",
                "information"
            FROM "worker_machine"
        `);
        await queryRunner.query(`
            DROP TABLE "worker_machine"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_worker_machine"
                RENAME TO "worker_machine"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "notifyStatus" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                "deleted" datetime,
                "releasesEnabled" boolean NOT NULL DEFAULT (0),
                "mapping" text,
                CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_project"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "displayName",
                    "notifyStatus",
                    "platformId",
                    "externalId",
                    "deleted"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "displayName",
                "notifyStatus",
                "platformId",
                "externalId",
                "deleted"
            FROM "project"
        `);
        await queryRunner.query(`
            DROP TABLE "project"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_project"
                RENAME TO "project"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
            WHERE "deleted" IS NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `);
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
                "environmentEnabled" boolean NOT NULL,
                "copilotSettings" text,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId"),
                CONSTRAINT "fk_platform_user" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `);
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
            FROM "platform"
        `);
        await queryRunner.query(`
            DROP TABLE "platform"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_platform"
                RENAME TO "platform"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
                RENAME TO "temporary_platform"
        `);
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
        `);
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
            FROM "temporary_platform"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_platform"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "project"
                RENAME TO "temporary_project"
        `);
        await queryRunner.query(`
            CREATE TABLE "project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "notifyStatus" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                "deleted" datetime,
                CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `);
        await queryRunner.query(`
            INSERT INTO "project"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "displayName",
                    "notifyStatus",
                    "platformId",
                    "externalId",
                    "deleted"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "displayName",
                "notifyStatus",
                "platformId",
                "externalId",
                "deleted"
            FROM "temporary_project"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_project"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
            WHERE "deleted" IS NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "worker_machine"
                RENAME TO "temporary_worker_machine"
        `);
        await queryRunner.query(`
            CREATE TABLE "worker_machine" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21),
                "type" varchar NOT NULL,
                "information" text NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "worker_machine"("id", "created", "updated", "information")
            SELECT "id",
                "created",
                "updated",
                "information"
            FROM "temporary_worker_machine"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_worker_machine"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform"
                RENAME TO "temporary_platform"
        `);
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
                "globalConnectionsEnabled" boolean NOT NULL,
                "customRolesEnabled" boolean NOT NULL,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId"),
                CONSTRAINT "fk_platform_user" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `);
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
            FROM "temporary_platform"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_platform"
        `);
        await queryRunner.query(`
            ALTER TABLE "worker_machine"
                RENAME TO "temporary_worker_machine"
        `);
        await queryRunner.query(`
            CREATE TABLE "worker_machine" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21),
                "type" varchar NOT NULL,
                "information" text NOT NULL,
                CONSTRAINT "FK_7f3c83a5162a2de787dc62bf519" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "worker_machine"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "type",
                    "information"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "information"
            FROM "temporary_worker_machine"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_worker_machine"
        `);
    }

}
