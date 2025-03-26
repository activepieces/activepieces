import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSqlite1740031972943 implements MigrationInterface {
    name = 'InitialSqlite1740031972943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "trigger_event" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "sourceName" varchar NOT NULL,
                "fileId" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_project_id_flow_id" ON "trigger_event" ("projectId", "flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_flow_id" ON "trigger_event" ("flowId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_event_file_id" ON "trigger_event" ("fileId")
        `)
        await queryRunner.query(`
            CREATE TABLE "app_event_routing" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "appName" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "identifierValue" varchar NOT NULL,
                "event" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_event_routing_flow_id" ON "app_event_routing" ("flowId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_event_flow_id_project_id_appName_identifier_value_event" ON "app_event_routing" (
                "appName",
                "projectId",
                "flowId",
                "identifierValue",
                "event"
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "file" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21),
                "platformId" varchar(21),
                "data" blob,
                "location" varchar NOT NULL,
                "fileName" varchar,
                "size" integer,
                "metadata" text,
                "s3Key" varchar,
                "type" varchar NOT NULL DEFAULT ('UNKNOWN'),
                "compression" varchar NOT NULL DEFAULT ('NONE')
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_file_project_id" ON "file" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_file_type_created_desc" ON "file" ("type", "created")
        `)
        await queryRunner.query(`
            CREATE TABLE "flag" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "value" text NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "schedule" text,
                "externalId" varchar,
                "publishedVersionId" varchar(21),
                CONSTRAINT "UQ_f6608fe13b916017a8202f993cb" UNIQUE ("publishedVersionId"),
                CONSTRAINT "REL_f6608fe13b916017a8202f993c" UNIQUE ("publishedVersionId")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `)
        await queryRunner.query(`
            CREATE TABLE "flow_version" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "schemaVersion" varchar,
                "trigger" text,
                "updatedBy" varchar,
                "valid" boolean NOT NULL,
                "state" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId")
        `)
        await queryRunner.query(`
            CREATE TABLE "flow_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                "environment" varchar,
                "flowDisplayName" varchar NOT NULL,
                "logsFileId" varchar(21),
                "status" varchar NOT NULL,
                "terminationReason" varchar,
                "tags" text,
                "duration" integer,
                "tasks" integer,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "pauseMetadata" text
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_created_desc" ON "flow_run" ("projectId", "environment", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("projectId", "environment", "status", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" (
                "projectId",
                "flowId",
                "environment",
                "status",
                "created"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_flow_id" ON "flow_run" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
        `)
        await queryRunner.query(`
            CREATE TABLE "project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted" datetime,
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "notifyStatus" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                "releasesEnabled" boolean NOT NULL DEFAULT (0)
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            CREATE TABLE "store-entry" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "key" varchar(128) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" text,
                CONSTRAINT "UQ_6f251cc141de0a8d84d7a4ac17d" UNIQUE ("projectId", "key")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "platformRole" varchar NOT NULL,
                "identityId" varchar NOT NULL,
                "externalId" varchar,
                "platformId" varchar
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "identityId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE TABLE "app_connection" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT ('ACTIVE'),
                "platformId" varchar NOT NULL,
                "pieceName" varchar NOT NULL,
                "ownerId" varchar,
                "projectIds" text NOT NULL,
                "scope" varchar NOT NULL,
                "value" text NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_project_ids_and_external_id" ON "app_connection" ("projectIds", "externalId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id" ON "app_connection" ("platformId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
        await queryRunner.query(`
            CREATE TABLE "webhook_simulation" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_webhook_simulation_flow_id" ON "webhook_simulation" ("flowId")
        `)
        await queryRunner.query(`
            CREATE TABLE "folder" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_folder_project_id_display_name" ON "folder" ("projectId", "displayName")
        `)
        await queryRunner.query(`
            CREATE TABLE "piece_metadata" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "authors" text NOT NULL,
                "displayName" varchar NOT NULL,
                "logoUrl" varchar NOT NULL,
                "projectUsage" integer NOT NULL DEFAULT (0),
                "description" varchar,
                "projectId" varchar,
                "platformId" varchar,
                "version" varchar NOT NULL,
                "minimumSupportedRelease" varchar NOT NULL,
                "maximumSupportedRelease" varchar NOT NULL,
                "auth" text,
                "actions" text NOT NULL,
                "triggers" text NOT NULL,
                "pieceType" varchar NOT NULL,
                "categories" text,
                "packageType" varchar NOT NULL,
                "archiveId" varchar(21),
                CONSTRAINT "REL_b43d7b070f0fc309932d4cf016" UNIQUE ("archiveId")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId")
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
                "smtp" text,
                "showPoweredBy" boolean NOT NULL,
                "flowIssuesEnabled" boolean NOT NULL,
                "cloudAuthEnabled" boolean NOT NULL DEFAULT (1),
                "customDomainsEnabled" boolean NOT NULL,
                "customAppearanceEnabled" boolean NOT NULL,
                "manageProjectsEnabled" boolean NOT NULL,
                "managePiecesEnabled" boolean NOT NULL,
                "manageTemplatesEnabled" boolean NOT NULL,
                "analyticsEnabled" boolean NOT NULL,
                "apiKeysEnabled" boolean NOT NULL,
                "projectRolesEnabled" boolean NOT NULL,
                "embeddingEnabled" boolean NOT NULL DEFAULT (1),
                "filteredPieceNames" text NOT NULL,
                "filteredPieceBehavior" varchar CHECK(
                    "filteredPieceBehavior" IN ('ALLOWED', 'BLOCKED')
                ) NOT NULL,
                "environmentsEnabled" boolean NOT NULL,
                "defaultLocale" varchar,
                "allowedAuthDomains" text NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "globalConnectionsEnabled" boolean NOT NULL,
                "customRolesEnabled" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" text NOT NULL,
                "auditLogEnabled" boolean NOT NULL,
                "alertsEnabled" boolean NOT NULL,
                "licenseKey" varchar,
                "pinnedPieces" text NOT NULL,
                "copilotSettings" text,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "tag" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_0aaf8e30187e0b89ebc9c4764ba" UNIQUE ("platformId", "name")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "piece_tag" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "pieceName" varchar NOT NULL,
                "tagId" varchar NOT NULL,
                CONSTRAINT "UQ_84a810ed305b758e07fa57f604a" UNIQUE ("tagId", "pieceName")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "tag_platformId" ON "piece_tag" ("platformId")
        `)
        await queryRunner.query(`
            CREATE TABLE "user_invitation" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "platformRole" varchar,
                "email" varchar NOT NULL,
                "projectId" varchar,
                "status" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "worker_machine" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "information" text NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "config" text NOT NULL,
                "baseUrl" varchar NOT NULL,
                "provider" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            CREATE TABLE "user_identity" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "password" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "verified" boolean NOT NULL DEFAULT (0),
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "tokenVersion" varchar,
                "provider" varchar NOT NULL,
                CONSTRAINT "UQ_7ad44f9fcbfc95e0a8436bbb029" UNIQUE ("email")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_identity_email" ON "user_identity" ("email")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_project_id_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_file_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_trigger_event" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "sourceName" varchar NOT NULL,
                "fileId" varchar NOT NULL,
                CONSTRAINT "fk_trigger_event_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_event_file_id" FOREIGN KEY ("fileId") REFERENCES "file" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_event_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_trigger_event"(
                    "id",
                    "created",
                    "updated",
                    "flowId",
                    "projectId",
                    "sourceName",
                    "fileId"
                )
            SELECT "id",
                "created",
                "updated",
                "flowId",
                "projectId",
                "sourceName",
                "fileId"
            FROM "trigger_event"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger_event"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_trigger_event"
                RENAME TO "trigger_event"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_project_id_flow_id" ON "trigger_event" ("projectId", "flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_flow_id" ON "trigger_event" ("flowId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_event_file_id" ON "trigger_event" ("fileId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_file_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_file_type_created_desc"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_file" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21),
                "platformId" varchar(21),
                "data" blob,
                "location" varchar NOT NULL,
                "fileName" varchar,
                "size" integer,
                "metadata" text,
                "s3Key" varchar,
                "type" varchar NOT NULL DEFAULT ('UNKNOWN'),
                "compression" varchar NOT NULL DEFAULT ('NONE'),
                CONSTRAINT "fk_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_file"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "platformId",
                    "data",
                    "location",
                    "fileName",
                    "size",
                    "metadata",
                    "s3Key",
                    "type",
                    "compression"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "platformId",
                "data",
                "location",
                "fileName",
                "size",
                "metadata",
                "s3Key",
                "type",
                "compression"
            FROM "file"
        `)
        await queryRunner.query(`
            DROP TABLE "file"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_file"
                RENAME TO "file"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_file_project_id" ON "file" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_file_type_created_desc" ON "file" ("type", "created")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "schedule" text,
                "externalId" varchar,
                "publishedVersionId" varchar(21),
                CONSTRAINT "UQ_f6608fe13b916017a8202f993cb" UNIQUE ("publishedVersionId"),
                CONSTRAINT "REL_f6608fe13b916017a8202f993c" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
                    "schedule",
                    "externalId",
                    "publishedVersionId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "folderId",
                "status",
                "schedule",
                "externalId",
                "publishedVersionId"
            FROM "flow"
        `)
        await queryRunner.query(`
            DROP TABLE "flow"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_flow"
                RENAME TO "flow"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_flow_version" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "schemaVersion" varchar,
                "trigger" text,
                "updatedBy" varchar,
                "valid" boolean NOT NULL,
                "state" varchar NOT NULL,
                CONSTRAINT "fk_updated_by_user_flow" FOREIGN KEY ("updatedBy") REFERENCES "user" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_version_flow" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_flow_version"(
                    "id",
                    "created",
                    "updated",
                    "flowId",
                    "displayName",
                    "schemaVersion",
                    "trigger",
                    "updatedBy",
                    "valid",
                    "state"
                )
            SELECT "id",
                "created",
                "updated",
                "flowId",
                "displayName",
                "schemaVersion",
                "trigger",
                "updatedBy",
                "valid",
                "state"
            FROM "flow_version"
        `)
        await queryRunner.query(`
            DROP TABLE "flow_version"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_flow_version"
                RENAME TO "flow_version"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_status_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_flow_id_environment_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_flow_id_environment_status_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_logs_file_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_flow_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                "environment" varchar,
                "flowDisplayName" varchar NOT NULL,
                "logsFileId" varchar(21),
                "status" varchar NOT NULL,
                "terminationReason" varchar,
                "tags" text,
                "duration" integer,
                "tasks" integer,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "pauseMetadata" text,
                CONSTRAINT "fk_flow_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_run_logs_file_id" FOREIGN KEY ("logsFileId") REFERENCES "file" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_flow_run"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "flowVersionId",
                    "environment",
                    "flowDisplayName",
                    "logsFileId",
                    "status",
                    "terminationReason",
                    "tags",
                    "duration",
                    "tasks",
                    "startTime",
                    "finishTime",
                    "pauseMetadata"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "flowVersionId",
                "environment",
                "flowDisplayName",
                "logsFileId",
                "status",
                "terminationReason",
                "tags",
                "duration",
                "tasks",
                "startTime",
                "finishTime",
                "pauseMetadata"
            FROM "flow_run"
        `)
        await queryRunner.query(`
            DROP TABLE "flow_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_flow_run"
                RENAME TO "flow_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_created_desc" ON "flow_run" ("projectId", "environment", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("projectId", "environment", "status", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" (
                "projectId",
                "flowId",
                "environment",
                "status",
                "created"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_flow_id" ON "flow_run" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted" datetime,
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "notifyStatus" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                "releasesEnabled" boolean NOT NULL DEFAULT (0),
                CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_project"(
                    "id",
                    "created",
                    "updated",
                    "deleted",
                    "ownerId",
                    "displayName",
                    "notifyStatus",
                    "platformId",
                    "externalId",
                    "releasesEnabled"
                )
            SELECT "id",
                "created",
                "updated",
                "deleted",
                "ownerId",
                "displayName",
                "notifyStatus",
                "platformId",
                "externalId",
                "releasesEnabled"
            FROM "project"
        `)
        await queryRunner.query(`
            DROP TABLE "project"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_project"
                RENAME TO "project"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "platformRole" varchar NOT NULL,
                "identityId" varchar NOT NULL,
                "externalId" varchar,
                "platformId" varchar,
                CONSTRAINT "FK_dea97e26c765a4cdb575957a146" FOREIGN KEY ("identityId") REFERENCES "user_identity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_user"(
                    "id",
                    "created",
                    "updated",
                    "status",
                    "platformRole",
                    "identityId",
                    "externalId",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "status",
                "platformRole",
                "identityId",
                "externalId",
                "platformId"
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
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "identityId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_ids_and_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_owner_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_app_connection" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT ('ACTIVE'),
                "platformId" varchar NOT NULL,
                "pieceName" varchar NOT NULL,
                "ownerId" varchar,
                "projectIds" text NOT NULL,
                "scope" varchar NOT NULL,
                "value" text NOT NULL,
                CONSTRAINT "fk_app_connection_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_app_connection"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "externalId",
                    "type",
                    "status",
                    "platformId",
                    "pieceName",
                    "ownerId",
                    "projectIds",
                    "scope",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "externalId",
                "type",
                "status",
                "platformId",
                "pieceName",
                "ownerId",
                "projectIds",
                "scope",
                "value"
            FROM "app_connection"
        `)
        await queryRunner.query(`
            DROP TABLE "app_connection"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_app_connection"
                RENAME TO "app_connection"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_project_ids_and_external_id" ON "app_connection" ("projectIds", "externalId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id" ON "app_connection" ("platformId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_folder_project_id_display_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_folder" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "fk_folder_project" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_folder"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "projectId"
            FROM "folder"
        `)
        await queryRunner.query(`
            DROP TABLE "folder"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_folder"
                RENAME TO "folder"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_folder_project_id_display_name" ON "folder" ("projectId", "displayName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_metadata_name_project_id_version"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_piece_metadata" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "authors" text NOT NULL,
                "displayName" varchar NOT NULL,
                "logoUrl" varchar NOT NULL,
                "projectUsage" integer NOT NULL DEFAULT (0),
                "description" varchar,
                "projectId" varchar,
                "platformId" varchar,
                "version" varchar NOT NULL,
                "minimumSupportedRelease" varchar NOT NULL,
                "maximumSupportedRelease" varchar NOT NULL,
                "auth" text,
                "actions" text NOT NULL,
                "triggers" text NOT NULL,
                "pieceType" varchar NOT NULL,
                "categories" text,
                "packageType" varchar NOT NULL,
                "archiveId" varchar(21),
                CONSTRAINT "REL_b43d7b070f0fc309932d4cf016" UNIQUE ("archiveId"),
                CONSTRAINT "fk_piece_metadata_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_piece_metadata_file" FOREIGN KEY ("archiveId") REFERENCES "file" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_piece_metadata"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "authors",
                    "displayName",
                    "logoUrl",
                    "projectUsage",
                    "description",
                    "projectId",
                    "platformId",
                    "version",
                    "minimumSupportedRelease",
                    "maximumSupportedRelease",
                    "auth",
                    "actions",
                    "triggers",
                    "pieceType",
                    "categories",
                    "packageType",
                    "archiveId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "authors",
                "displayName",
                "logoUrl",
                "projectUsage",
                "description",
                "projectId",
                "platformId",
                "version",
                "minimumSupportedRelease",
                "maximumSupportedRelease",
                "auth",
                "actions",
                "triggers",
                "pieceType",
                "categories",
                "packageType",
                "archiveId"
            FROM "piece_metadata"
        `)
        await queryRunner.query(`
            DROP TABLE "piece_metadata"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_piece_metadata"
                RENAME TO "piece_metadata"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId")
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
                "smtp" text,
                "showPoweredBy" boolean NOT NULL,
                "flowIssuesEnabled" boolean NOT NULL,
                "cloudAuthEnabled" boolean NOT NULL DEFAULT (1),
                "customDomainsEnabled" boolean NOT NULL,
                "customAppearanceEnabled" boolean NOT NULL,
                "manageProjectsEnabled" boolean NOT NULL,
                "managePiecesEnabled" boolean NOT NULL,
                "manageTemplatesEnabled" boolean NOT NULL,
                "analyticsEnabled" boolean NOT NULL,
                "apiKeysEnabled" boolean NOT NULL,
                "projectRolesEnabled" boolean NOT NULL,
                "embeddingEnabled" boolean NOT NULL DEFAULT (1),
                "filteredPieceNames" text NOT NULL,
                "filteredPieceBehavior" varchar CHECK(
                    "filteredPieceBehavior" IN ('ALLOWED', 'BLOCKED')
                ) NOT NULL,
                "environmentsEnabled" boolean NOT NULL,
                "defaultLocale" varchar,
                "allowedAuthDomains" text NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "globalConnectionsEnabled" boolean NOT NULL,
                "customRolesEnabled" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" text NOT NULL,
                "auditLogEnabled" boolean NOT NULL,
                "alertsEnabled" boolean NOT NULL,
                "licenseKey" varchar,
                "pinnedPieces" text NOT NULL,
                "copilotSettings" text,
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
                    "smtp",
                    "showPoweredBy",
                    "flowIssuesEnabled",
                    "cloudAuthEnabled",
                    "customDomainsEnabled",
                    "customAppearanceEnabled",
                    "manageProjectsEnabled",
                    "managePiecesEnabled",
                    "manageTemplatesEnabled",
                    "analyticsEnabled",
                    "apiKeysEnabled",
                    "projectRolesEnabled",
                    "embeddingEnabled",
                    "filteredPieceNames",
                    "filteredPieceBehavior",
                    "environmentsEnabled",
                    "defaultLocale",
                    "allowedAuthDomains",
                    "enforceAllowedAuthDomains",
                    "ssoEnabled",
                    "globalConnectionsEnabled",
                    "customRolesEnabled",
                    "emailAuthEnabled",
                    "federatedAuthProviders",
                    "auditLogEnabled",
                    "alertsEnabled",
                    "licenseKey",
                    "pinnedPieces",
                    "copilotSettings"
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
                "smtp",
                "showPoweredBy",
                "flowIssuesEnabled",
                "cloudAuthEnabled",
                "customDomainsEnabled",
                "customAppearanceEnabled",
                "manageProjectsEnabled",
                "managePiecesEnabled",
                "manageTemplatesEnabled",
                "analyticsEnabled",
                "apiKeysEnabled",
                "projectRolesEnabled",
                "embeddingEnabled",
                "filteredPieceNames",
                "filteredPieceBehavior",
                "environmentsEnabled",
                "defaultLocale",
                "allowedAuthDomains",
                "enforceAllowedAuthDomains",
                "ssoEnabled",
                "globalConnectionsEnabled",
                "customRolesEnabled",
                "emailAuthEnabled",
                "federatedAuthProviders",
                "auditLogEnabled",
                "alertsEnabled",
                "licenseKey",
                "pinnedPieces",
                "copilotSettings"
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
            CREATE TABLE "temporary_tag" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_0aaf8e30187e0b89ebc9c4764ba" UNIQUE ("platformId", "name"),
                CONSTRAINT "FK_9dec09e187398715b7f1e32a6cb" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_tag"("id", "created", "updated", "platformId", "name")
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "name"
            FROM "tag"
        `)
        await queryRunner.query(`
            DROP TABLE "tag"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_tag"
                RENAME TO "tag"
        `)
        await queryRunner.query(`
            DROP INDEX "tag_platformId"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_piece_tag" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "pieceName" varchar NOT NULL,
                "tagId" varchar NOT NULL,
                CONSTRAINT "UQ_84a810ed305b758e07fa57f604a" UNIQUE ("tagId", "pieceName"),
                CONSTRAINT "FK_6ee5c7cca2b33700e400ea2703e" FOREIGN KEY ("tagId") REFERENCES "tag" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_5f483919deb37416ff32594918a" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_piece_tag"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "pieceName",
                    "tagId"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "pieceName",
                "tagId"
            FROM "piece_tag"
        `)
        await queryRunner.query(`
            DROP TABLE "piece_tag"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_piece_tag"
                RENAME TO "piece_tag"
        `)
        await queryRunner.query(`
            CREATE INDEX "tag_platformId" ON "piece_tag" ("platformId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_invitation_email_platform_project"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_user_invitation" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "platformRole" varchar,
                "email" varchar NOT NULL,
                "projectId" varchar,
                "status" varchar NOT NULL,
                CONSTRAINT "fk_user_invitation_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_user_invitation"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "type",
                    "platformRole",
                    "email",
                    "projectId",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "email",
                "projectId",
                "status"
            FROM "user_invitation"
        `)
        await queryRunner.query(`
            DROP TABLE "user_invitation"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_user_invitation"
                RENAME TO "user_invitation"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "config" text NOT NULL,
                "baseUrl" varchar NOT NULL,
                "provider" varchar NOT NULL,
                CONSTRAINT "fk_ai_provider_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "baseUrl",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "baseUrl",
                "provider"
            FROM "ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_ai_provider"
                RENAME TO "ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
                RENAME TO "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "config" text NOT NULL,
                "baseUrl" varchar NOT NULL,
                "provider" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "baseUrl",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "baseUrl",
                "provider"
            FROM "temporary_ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_invitation_email_platform_project"
        `)
        await queryRunner.query(`
            ALTER TABLE "user_invitation"
                RENAME TO "temporary_user_invitation"
        `)
        await queryRunner.query(`
            CREATE TABLE "user_invitation" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "platformRole" varchar,
                "email" varchar NOT NULL,
                "projectId" varchar,
                "status" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "user_invitation"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "type",
                    "platformRole",
                    "email",
                    "projectId",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "email",
                "projectId",
                "status"
            FROM "temporary_user_invitation"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user_invitation"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "tag_platformId"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_tag"
                RENAME TO "temporary_piece_tag"
        `)
        await queryRunner.query(`
            CREATE TABLE "piece_tag" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "pieceName" varchar NOT NULL,
                "tagId" varchar NOT NULL,
                CONSTRAINT "UQ_84a810ed305b758e07fa57f604a" UNIQUE ("tagId", "pieceName")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "piece_tag"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "pieceName",
                    "tagId"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "pieceName",
                "tagId"
            FROM "temporary_piece_tag"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_piece_tag"
        `)
        await queryRunner.query(`
            CREATE INDEX "tag_platformId" ON "piece_tag" ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "tag"
                RENAME TO "temporary_tag"
        `)
        await queryRunner.query(`
            CREATE TABLE "tag" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_0aaf8e30187e0b89ebc9c4764ba" UNIQUE ("platformId", "name")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "tag"("id", "created", "updated", "platformId", "name")
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "name"
            FROM "temporary_tag"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_tag"
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
                "smtp" text,
                "showPoweredBy" boolean NOT NULL,
                "flowIssuesEnabled" boolean NOT NULL,
                "cloudAuthEnabled" boolean NOT NULL DEFAULT (1),
                "customDomainsEnabled" boolean NOT NULL,
                "customAppearanceEnabled" boolean NOT NULL,
                "manageProjectsEnabled" boolean NOT NULL,
                "managePiecesEnabled" boolean NOT NULL,
                "manageTemplatesEnabled" boolean NOT NULL,
                "analyticsEnabled" boolean NOT NULL,
                "apiKeysEnabled" boolean NOT NULL,
                "projectRolesEnabled" boolean NOT NULL,
                "embeddingEnabled" boolean NOT NULL DEFAULT (1),
                "filteredPieceNames" text NOT NULL,
                "filteredPieceBehavior" varchar CHECK(
                    "filteredPieceBehavior" IN ('ALLOWED', 'BLOCKED')
                ) NOT NULL,
                "environmentsEnabled" boolean NOT NULL,
                "defaultLocale" varchar,
                "allowedAuthDomains" text NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "globalConnectionsEnabled" boolean NOT NULL,
                "customRolesEnabled" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" text NOT NULL,
                "auditLogEnabled" boolean NOT NULL,
                "alertsEnabled" boolean NOT NULL,
                "licenseKey" varchar,
                "pinnedPieces" text NOT NULL,
                "copilotSettings" text,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId")
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
                    "smtp",
                    "showPoweredBy",
                    "flowIssuesEnabled",
                    "cloudAuthEnabled",
                    "customDomainsEnabled",
                    "customAppearanceEnabled",
                    "manageProjectsEnabled",
                    "managePiecesEnabled",
                    "manageTemplatesEnabled",
                    "analyticsEnabled",
                    "apiKeysEnabled",
                    "projectRolesEnabled",
                    "embeddingEnabled",
                    "filteredPieceNames",
                    "filteredPieceBehavior",
                    "environmentsEnabled",
                    "defaultLocale",
                    "allowedAuthDomains",
                    "enforceAllowedAuthDomains",
                    "ssoEnabled",
                    "globalConnectionsEnabled",
                    "customRolesEnabled",
                    "emailAuthEnabled",
                    "federatedAuthProviders",
                    "auditLogEnabled",
                    "alertsEnabled",
                    "licenseKey",
                    "pinnedPieces",
                    "copilotSettings"
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
                "smtp",
                "showPoweredBy",
                "flowIssuesEnabled",
                "cloudAuthEnabled",
                "customDomainsEnabled",
                "customAppearanceEnabled",
                "manageProjectsEnabled",
                "managePiecesEnabled",
                "manageTemplatesEnabled",
                "analyticsEnabled",
                "apiKeysEnabled",
                "projectRolesEnabled",
                "embeddingEnabled",
                "filteredPieceNames",
                "filteredPieceBehavior",
                "environmentsEnabled",
                "defaultLocale",
                "allowedAuthDomains",
                "enforceAllowedAuthDomains",
                "ssoEnabled",
                "globalConnectionsEnabled",
                "customRolesEnabled",
                "emailAuthEnabled",
                "federatedAuthProviders",
                "auditLogEnabled",
                "alertsEnabled",
                "licenseKey",
                "pinnedPieces",
                "copilotSettings"
            FROM "temporary_platform"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_platform"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_metadata_name_project_id_version"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
                RENAME TO "temporary_piece_metadata"
        `)
        await queryRunner.query(`
            CREATE TABLE "piece_metadata" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "authors" text NOT NULL,
                "displayName" varchar NOT NULL,
                "logoUrl" varchar NOT NULL,
                "projectUsage" integer NOT NULL DEFAULT (0),
                "description" varchar,
                "projectId" varchar,
                "platformId" varchar,
                "version" varchar NOT NULL,
                "minimumSupportedRelease" varchar NOT NULL,
                "maximumSupportedRelease" varchar NOT NULL,
                "auth" text,
                "actions" text NOT NULL,
                "triggers" text NOT NULL,
                "pieceType" varchar NOT NULL,
                "categories" text,
                "packageType" varchar NOT NULL,
                "archiveId" varchar(21),
                CONSTRAINT "REL_b43d7b070f0fc309932d4cf016" UNIQUE ("archiveId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "piece_metadata"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "authors",
                    "displayName",
                    "logoUrl",
                    "projectUsage",
                    "description",
                    "projectId",
                    "platformId",
                    "version",
                    "minimumSupportedRelease",
                    "maximumSupportedRelease",
                    "auth",
                    "actions",
                    "triggers",
                    "pieceType",
                    "categories",
                    "packageType",
                    "archiveId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "authors",
                "displayName",
                "logoUrl",
                "projectUsage",
                "description",
                "projectId",
                "platformId",
                "version",
                "minimumSupportedRelease",
                "maximumSupportedRelease",
                "auth",
                "actions",
                "triggers",
                "pieceType",
                "categories",
                "packageType",
                "archiveId"
            FROM "temporary_piece_metadata"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_piece_metadata"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_folder_project_id_display_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "folder"
                RENAME TO "temporary_folder"
        `)
        await queryRunner.query(`
            CREATE TABLE "folder" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "folder"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "projectId"
            FROM "temporary_folder"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_folder"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_folder_project_id_display_name" ON "folder" ("projectId", "displayName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_owner_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_ids_and_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
                RENAME TO "temporary_app_connection"
        `)
        await queryRunner.query(`
            CREATE TABLE "app_connection" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT ('ACTIVE'),
                "platformId" varchar NOT NULL,
                "pieceName" varchar NOT NULL,
                "ownerId" varchar,
                "projectIds" text NOT NULL,
                "scope" varchar NOT NULL,
                "value" text NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "app_connection"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "externalId",
                    "type",
                    "status",
                    "platformId",
                    "pieceName",
                    "ownerId",
                    "projectIds",
                    "scope",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "externalId",
                "type",
                "status",
                "platformId",
                "pieceName",
                "ownerId",
                "projectIds",
                "scope",
                "value"
            FROM "temporary_app_connection"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_app_connection"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id" ON "app_connection" ("platformId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_project_ids_and_external_id" ON "app_connection" ("projectIds", "externalId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
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
                "status" varchar NOT NULL,
                "platformRole" varchar NOT NULL,
                "identityId" varchar NOT NULL,
                "externalId" varchar,
                "platformId" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "user"(
                    "id",
                    "created",
                    "updated",
                    "status",
                    "platformRole",
                    "identityId",
                    "externalId",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "status",
                "platformRole",
                "identityId",
                "externalId",
                "platformId"
            FROM "temporary_user"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "identityId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
                RENAME TO "temporary_project"
        `)
        await queryRunner.query(`
            CREATE TABLE "project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted" datetime,
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "notifyStatus" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                "releasesEnabled" boolean NOT NULL DEFAULT (0)
            )
        `)
        await queryRunner.query(`
            INSERT INTO "project"(
                    "id",
                    "created",
                    "updated",
                    "deleted",
                    "ownerId",
                    "displayName",
                    "notifyStatus",
                    "platformId",
                    "externalId",
                    "releasesEnabled"
                )
            SELECT "id",
                "created",
                "updated",
                "deleted",
                "ownerId",
                "displayName",
                "notifyStatus",
                "platformId",
                "externalId",
                "releasesEnabled"
            FROM "temporary_project"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_project"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_logs_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_flow_id_environment_status_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_flow_id_environment_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_status_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_created_desc"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
                RENAME TO "temporary_flow_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "flow_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                "environment" varchar,
                "flowDisplayName" varchar NOT NULL,
                "logsFileId" varchar(21),
                "status" varchar NOT NULL,
                "terminationReason" varchar,
                "tags" text,
                "duration" integer,
                "tasks" integer,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "pauseMetadata" text
            )
        `)
        await queryRunner.query(`
            INSERT INTO "flow_run"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "flowVersionId",
                    "environment",
                    "flowDisplayName",
                    "logsFileId",
                    "status",
                    "terminationReason",
                    "tags",
                    "duration",
                    "tasks",
                    "startTime",
                    "finishTime",
                    "pauseMetadata"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "flowVersionId",
                "environment",
                "flowDisplayName",
                "logsFileId",
                "status",
                "terminationReason",
                "tags",
                "duration",
                "tasks",
                "startTime",
                "finishTime",
                "pauseMetadata"
            FROM "temporary_flow_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_flow_id" ON "flow_run" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" (
                "projectId",
                "flowId",
                "environment",
                "status",
                "created"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("projectId", "environment", "status", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_created_desc" ON "flow_run" ("projectId", "environment", "created")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version"
                RENAME TO "temporary_flow_version"
        `)
        await queryRunner.query(`
            CREATE TABLE "flow_version" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "schemaVersion" varchar,
                "trigger" text,
                "updatedBy" varchar,
                "valid" boolean NOT NULL,
                "state" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "flow_version"(
                    "id",
                    "created",
                    "updated",
                    "flowId",
                    "displayName",
                    "schemaVersion",
                    "trigger",
                    "updatedBy",
                    "valid",
                    "state"
                )
            SELECT "id",
                "created",
                "updated",
                "flowId",
                "displayName",
                "schemaVersion",
                "trigger",
                "updatedBy",
                "valid",
                "state"
            FROM "temporary_flow_version"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow_version"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
                RENAME TO "temporary_flow"
        `)
        await queryRunner.query(`
            CREATE TABLE "flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "schedule" text,
                "externalId" varchar,
                "publishedVersionId" varchar(21),
                CONSTRAINT "UQ_f6608fe13b916017a8202f993cb" UNIQUE ("publishedVersionId"),
                CONSTRAINT "REL_f6608fe13b916017a8202f993c" UNIQUE ("publishedVersionId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
                    "schedule",
                    "externalId",
                    "publishedVersionId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "folderId",
                "status",
                "schedule",
                "externalId",
                "publishedVersionId"
            FROM "temporary_flow"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_file_type_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_file_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "file"
                RENAME TO "temporary_file"
        `)
        await queryRunner.query(`
            CREATE TABLE "file" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21),
                "platformId" varchar(21),
                "data" blob,
                "location" varchar NOT NULL,
                "fileName" varchar,
                "size" integer,
                "metadata" text,
                "s3Key" varchar,
                "type" varchar NOT NULL DEFAULT ('UNKNOWN'),
                "compression" varchar NOT NULL DEFAULT ('NONE')
            )
        `)
        await queryRunner.query(`
            INSERT INTO "file"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "platformId",
                    "data",
                    "location",
                    "fileName",
                    "size",
                    "metadata",
                    "s3Key",
                    "type",
                    "compression"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "platformId",
                "data",
                "location",
                "fileName",
                "size",
                "metadata",
                "s3Key",
                "type",
                "compression"
            FROM "temporary_file"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_file"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_file_type_created_desc" ON "file" ("type", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_file_project_id" ON "file" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_project_id_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_event"
                RENAME TO "temporary_trigger_event"
        `)
        await queryRunner.query(`
            CREATE TABLE "trigger_event" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "sourceName" varchar NOT NULL,
                "fileId" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "trigger_event"(
                    "id",
                    "created",
                    "updated",
                    "flowId",
                    "projectId",
                    "sourceName",
                    "fileId"
                )
            SELECT "id",
                "created",
                "updated",
                "flowId",
                "projectId",
                "sourceName",
                "fileId"
            FROM "temporary_trigger_event"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_trigger_event"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_event_file_id" ON "trigger_event" ("fileId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_flow_id" ON "trigger_event" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_event_project_id_flow_id" ON "trigger_event" ("projectId", "flowId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_identity_email"
        `)
        await queryRunner.query(`
            DROP TABLE "user_identity"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "worker_machine"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_invitation_email_platform_project"
        `)
        await queryRunner.query(`
            DROP TABLE "user_invitation"
        `)
        await queryRunner.query(`
            DROP INDEX "tag_platformId"
        `)
        await queryRunner.query(`
            DROP TABLE "piece_tag"
        `)
        await queryRunner.query(`
            DROP TABLE "tag"
        `)
        await queryRunner.query(`
            DROP TABLE "platform"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_piece_metadata_name_project_id_version"
        `)
        await queryRunner.query(`
            DROP TABLE "piece_metadata"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_folder_project_id_display_name"
        `)
        await queryRunner.query(`
            DROP TABLE "folder"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_webhook_simulation_flow_id"
        `)
        await queryRunner.query(`
            DROP TABLE "webhook_simulation"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_owner_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_ids_and_external_id"
        `)
        await queryRunner.query(`
            DROP TABLE "app_connection"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP TABLE "user"
        `)
        await queryRunner.query(`
            DROP TABLE "store-entry"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_logs_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_flow_id_environment_status_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_flow_id_environment_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_status_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_created_desc"
        `)
        await queryRunner.query(`
            DROP TABLE "flow_run"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id"
        `)
        await queryRunner.query(`
            DROP TABLE "flow_version"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "flow"
        `)
        await queryRunner.query(`
            DROP TABLE "flag"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_file_type_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_file_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "file"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_event_flow_id_project_id_appName_identifier_value_event"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_event_routing_flow_id"
        `)
        await queryRunner.query(`
            DROP TABLE "app_event_routing"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_event_project_id_flow_id"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger_event"
        `)
    }

}
