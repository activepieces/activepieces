import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepNameToTestInFlowRunEntitySqlite1754330864602 implements MigrationInterface {
    name = 'AddStepNameToTestInFlowRunEntitySqlite1754330864602'

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
                "handshakeConfiguration" text,
                "schedule" text,
                "externalId" varchar NOT NULL,
                "publishedVersionId" varchar(21),
                "metadata" text,
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
                "connectionIds" text NOT NULL,
                "agentIds" text NOT NULL,
                "updatedBy" varchar,
                "valid" boolean NOT NULL,
                "state" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id_created_desc" ON "flow_version" ("flowId", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_schema_version" ON "flow_version" ("schemaVersion")
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
                "parentRunId" varchar(21),
                "failParentOnFailure" boolean NOT NULL DEFAULT (1),
                "status" varchar NOT NULL,
                "tags" text,
                "duration" integer,
                "tasks" integer,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "pauseMetadata" text,
                "failedStepName" varchar,
                "stepNameToTest" varchar
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
            CREATE INDEX "idx_flow_run_flow_failed_step" ON "flow_run" ("flowId", "failedStepName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_parent_run_id" ON "flow_run" ("parentRunId")
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
                "releasesEnabled" boolean NOT NULL DEFAULT (0),
                "metadata" text
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
                "lastChangelogDismissed" datetime,
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
                "value" text NOT NULL,
                "metadata" text
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id_and_external_id" ON "app_connection" ("platformId", "externalId")
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
                "projectId" varchar(21) NOT NULL,
                "displayOrder" integer NOT NULL DEFAULT (0)
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
                "i18n" text,
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
                "cloudAuthEnabled" boolean NOT NULL DEFAULT (1),
                "filteredPieceNames" text NOT NULL,
                "filteredPieceBehavior" varchar CHECK(
                    "filteredPieceBehavior" IN ('ALLOWED', 'BLOCKED')
                ) NOT NULL,
                "allowedAuthDomains" text NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" text NOT NULL,
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
            CREATE TABLE "issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "lastOccurrence" datetime NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                "stepName" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
        await queryRunner.query(`
            CREATE TABLE "alert" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "channel" varchar NOT NULL,
                "receiver" varchar NOT NULL
            )
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
                "status" varchar NOT NULL,
                "projectRoleId" varchar
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
                "config" text NOT NULL,
                "provider" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            CREATE TABLE "project_role" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "permissions" text NOT NULL,
                "platformId" varchar,
                "type" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "agentId" varchar,
                "trigger" varchar,
                "status" varchar,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "REL_6c8e7a0da6e6cbc9b5bfc80664" UNIQUE ("agentId")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            CREATE TABLE "field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK(
                    "type" IN ('TEXT', 'NUMBER', 'DATE', 'STATIC_DROPDOWN')
                ) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                "data" text
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `)
        await queryRunner.query(`
            CREATE TABLE "record" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_table_id_project_id_record_id" ON "record" ("tableId", "projectId", "id")
        `)
        await queryRunner.query(`
            CREATE TABLE "cell" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "recordId" varchar(21) NOT NULL,
                "fieldId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_cell_project_id_field_id_record_id_unique" ON "cell" ("projectId", "fieldId", "recordId")
        `)
        await queryRunner.query(`
            CREATE TABLE "table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21) NOT NULL
            )
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
            CREATE TABLE "todo" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "title" varchar NOT NULL,
                "description" varchar,
                "environment" varchar NOT NULL,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "createdByUserId" varchar(21),
                "flowId" varchar(21),
                "runId" varchar(21),
                "resolveUrl" varchar,
                "locked" boolean NOT NULL DEFAULT (0)
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_project_id" ON "todo" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_flow_id" ON "todo" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_platform_id" ON "todo" ("platformId")
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "agentId" varchar,
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                "externalId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id_external_id" ON "mcp" ("projectId", "externalId")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `)
        await queryRunner.query(`
            CREATE TABLE "agent" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "profilePictureUrl" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "description" varchar NOT NULL,
                "maxSteps" integer NOT NULL,
                "mcpId" varchar NOT NULL,
                "testPrompt" varchar NOT NULL,
                "systemPrompt" varchar NOT NULL,
                "projectId" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "outputType" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "outputFields" text NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_projectId_externalId" ON "agent" ("projectId", "externalId")
        `)
        await queryRunner.query(`
            CREATE TABLE "todo_activity" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "todoId" varchar(21) NOT NULL,
                "userId" varchar(21),
                "content" text NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_todo_id" ON "todo_activity" ("todoId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_user_id" ON "todo_activity" ("userId")
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_tool" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "type" varchar CHECK("type" IN ('PIECE', 'FLOW')) NOT NULL,
                "pieceMetadata" text,
                "flowId" varchar
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "toolId" varchar(21),
                "metadata" text NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "status" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_usage" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "provider" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "model" varchar NOT NULL,
                "cost" decimal NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "metadata" text NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("platformId", "created", "projectId")
        `)
        await queryRunner.query(`
            CREATE TABLE "agent_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "output" text,
                "metadata" text,
                "steps" text NOT NULL,
                "message" varchar,
                "prompt" varchar NOT NULL,
                "startTime" datetime,
                "finishTime" datetime
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_agent_run_project_agent_starttime" ON "agent_run" ("projectId", "agentId", "startTime")
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
                "handshakeConfiguration" text,
                "schedule" text,
                "externalId" varchar NOT NULL,
                "publishedVersionId" varchar(21),
                "metadata" text,
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
                    "handshakeConfiguration",
                    "schedule",
                    "externalId",
                    "publishedVersionId",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "folderId",
                "status",
                "handshakeConfiguration",
                "schedule",
                "externalId",
                "publishedVersionId",
                "metadata"
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
            DROP INDEX "idx_flow_version_flow_id_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_schema_version"
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
                "connectionIds" text NOT NULL,
                "agentIds" text NOT NULL,
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
                    "connectionIds",
                    "agentIds",
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
                "connectionIds",
                "agentIds",
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
            CREATE INDEX "idx_flow_version_flow_id_created_desc" ON "flow_version" ("flowId", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_schema_version" ON "flow_version" ("schemaVersion")
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
            DROP INDEX "idx_flow_run_flow_failed_step"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_parent_run_id"
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
                "parentRunId" varchar(21),
                "failParentOnFailure" boolean NOT NULL DEFAULT (1),
                "status" varchar NOT NULL,
                "tags" text,
                "duration" integer,
                "tasks" integer,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "pauseMetadata" text,
                "failedStepName" varchar,
                "stepNameToTest" varchar,
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
                    "parentRunId",
                    "failParentOnFailure",
                    "status",
                    "tags",
                    "duration",
                    "tasks",
                    "startTime",
                    "finishTime",
                    "pauseMetadata",
                    "failedStepName",
                    "stepNameToTest"
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
                "parentRunId",
                "failParentOnFailure",
                "status",
                "tags",
                "duration",
                "tasks",
                "startTime",
                "finishTime",
                "pauseMetadata",
                "failedStepName",
                "stepNameToTest"
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
            CREATE INDEX "idx_flow_run_flow_failed_step" ON "flow_run" ("flowId", "failedStepName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_parent_run_id" ON "flow_run" ("parentRunId")
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
                "metadata" text,
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
                    "releasesEnabled",
                    "metadata"
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
                "releasesEnabled",
                "metadata"
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
                "lastChangelogDismissed" datetime,
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
                    "lastChangelogDismissed",
                    "platformRole",
                    "identityId",
                    "externalId",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "status",
                "lastChangelogDismissed",
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
            DROP INDEX "idx_app_connection_platform_id_and_external_id"
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
                "metadata" text,
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
                    "value",
                    "metadata"
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
                "value",
                "metadata"
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
            CREATE INDEX "idx_app_connection_platform_id_and_external_id" ON "app_connection" ("platformId", "externalId")
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
                "displayOrder" integer NOT NULL DEFAULT (0),
                CONSTRAINT "fk_folder_project" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_folder"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "projectId",
                    "displayOrder"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "projectId",
                "displayOrder"
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
                "i18n" text,
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
                    "archiveId",
                    "i18n"
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
                "archiveId",
                "i18n"
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
                "cloudAuthEnabled" boolean NOT NULL DEFAULT (1),
                "filteredPieceNames" text NOT NULL,
                "filteredPieceBehavior" varchar CHECK(
                    "filteredPieceBehavior" IN ('ALLOWED', 'BLOCKED')
                ) NOT NULL,
                "allowedAuthDomains" text NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" text NOT NULL,
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
                    "cloudAuthEnabled",
                    "filteredPieceNames",
                    "filteredPieceBehavior",
                    "allowedAuthDomains",
                    "enforceAllowedAuthDomains",
                    "emailAuthEnabled",
                    "federatedAuthProviders",
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
                "cloudAuthEnabled",
                "filteredPieceNames",
                "filteredPieceBehavior",
                "allowedAuthDomains",
                "enforceAllowedAuthDomains",
                "emailAuthEnabled",
                "federatedAuthProviders",
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
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "lastOccurrence" datetime NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                "stepName" varchar NOT NULL,
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_eba4c662c378687bf44f97b3f1f" FOREIGN KEY ("flowVersionId") REFERENCES "flow_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "lastOccurrence",
                    "flowVersionId",
                    "stepName"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "lastOccurrence",
                "flowVersionId",
                "stepName"
            FROM "issue"
        `)
        await queryRunner.query(`
            DROP TABLE "issue"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_issue"
                RENAME TO "issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
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
                "projectRoleId" varchar,
                CONSTRAINT "fk_user_invitation_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_user_invitation_project_role_id" FOREIGN KEY ("projectRoleId") REFERENCES "project_role" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                    "status",
                    "projectRoleId"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "email",
                "projectId",
                "status",
                "projectRoleId"
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
                "config" text NOT NULL,
                "provider" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                CONSTRAINT "fk_ai_provider_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "config",
                    "provider",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "config",
                "provider",
                "platformId"
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
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "agentId" varchar,
                "trigger" varchar,
                "status" varchar,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "REL_6c8e7a0da6e6cbc9b5bfc80664" UNIQUE ("agentId"),
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_table"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "externalId",
                    "agentId",
                    "trigger",
                    "status",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "externalId",
                "agentId",
                "trigger",
                "status",
                "projectId"
            FROM "table"
        `)
        await queryRunner.query(`
            DROP TABLE "table"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_table"
                RENAME TO "table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK(
                    "type" IN ('TEXT', 'NUMBER', 'DATE', 'STATIC_DROPDOWN')
                ) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                "data" text,
                CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_field"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "type",
                    "tableId",
                    "projectId",
                    "externalId",
                    "data"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId",
                "projectId",
                "externalId",
                "data"
            FROM "field"
        `)
        await queryRunner.query(`
            DROP TABLE "field"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_field"
                RENAME TO "field"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_project_id_table_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_table_id_project_id_record_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_record" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "fk_record_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_record_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_record"(
                    "id",
                    "created",
                    "updated",
                    "tableId",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "tableId",
                "projectId"
            FROM "record"
        `)
        await queryRunner.query(`
            DROP TABLE "record"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_record"
                RENAME TO "record"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_table_id_project_id_record_id" ON "record" ("tableId", "projectId", "id")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_cell_project_id_field_id_record_id_unique"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_cell" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "recordId" varchar(21) NOT NULL,
                "fieldId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" varchar NOT NULL,
                CONSTRAINT "fk_cell_record_id" FOREIGN KEY ("recordId") REFERENCES "record" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_cell_field_id" FOREIGN KEY ("fieldId") REFERENCES "field" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_cell_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_cell"(
                    "id",
                    "created",
                    "updated",
                    "recordId",
                    "fieldId",
                    "projectId",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "recordId",
                "fieldId",
                "projectId",
                "value"
            FROM "cell"
        `)
        await queryRunner.query(`
            DROP TABLE "cell"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_cell"
                RENAME TO "cell"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_cell_project_id_field_id_record_id_unique" ON "cell" ("projectId", "fieldId", "recordId")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21) NOT NULL,
                CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "events",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "tableId",
                "events",
                "flowId"
            FROM "table_webhook"
        `)
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_table_webhook"
                RENAME TO "table_webhook"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_platform_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_todo" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "title" varchar NOT NULL,
                "description" varchar,
                "environment" varchar NOT NULL,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "createdByUserId" varchar(21),
                "flowId" varchar(21),
                "runId" varchar(21),
                "resolveUrl" varchar,
                "locked" boolean NOT NULL DEFAULT (0),
                CONSTRAINT "fk_todo_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_c79681af2867d6f762d94b885a9" FOREIGN KEY ("createdByUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_run_id" FOREIGN KEY ("runId") REFERENCES "flow_run" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_assignee_id" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_todo"(
                    "id",
                    "created",
                    "updated",
                    "title",
                    "description",
                    "environment",
                    "status",
                    "statusOptions",
                    "assigneeId",
                    "platformId",
                    "projectId",
                    "createdByUserId",
                    "flowId",
                    "runId",
                    "resolveUrl",
                    "locked"
                )
            SELECT "id",
                "created",
                "updated",
                "title",
                "description",
                "environment",
                "status",
                "statusOptions",
                "assigneeId",
                "platformId",
                "projectId",
                "createdByUserId",
                "flowId",
                "runId",
                "resolveUrl",
                "locked"
            FROM "todo"
        `)
        await queryRunner.query(`
            DROP TABLE "todo"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_todo"
                RENAME TO "todo"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_project_id" ON "todo" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_flow_id" ON "todo" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_platform_id" ON "todo" ("platformId")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "agentId" varchar,
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                "externalId" varchar(21) NOT NULL,
                CONSTRAINT "fk_mcp_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "agentId",
                    "projectId",
                    "token",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "agentId",
                "projectId",
                "token",
                "externalId"
            FROM "mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp"
                RENAME TO "mcp"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id_external_id" ON "mcp" ("projectId", "externalId")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_agent_projectId_externalId"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_agent" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "profilePictureUrl" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "description" varchar NOT NULL,
                "maxSteps" integer NOT NULL,
                "mcpId" varchar NOT NULL,
                "testPrompt" varchar NOT NULL,
                "systemPrompt" varchar NOT NULL,
                "projectId" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "outputType" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "outputFields" text NOT NULL,
                CONSTRAINT "fk_agent_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_agent_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_agent"(
                    "id",
                    "created",
                    "updated",
                    "profilePictureUrl",
                    "displayName",
                    "description",
                    "maxSteps",
                    "mcpId",
                    "testPrompt",
                    "systemPrompt",
                    "projectId",
                    "platformId",
                    "outputType",
                    "externalId",
                    "outputFields"
                )
            SELECT "id",
                "created",
                "updated",
                "profilePictureUrl",
                "displayName",
                "description",
                "maxSteps",
                "mcpId",
                "testPrompt",
                "systemPrompt",
                "projectId",
                "platformId",
                "outputType",
                "externalId",
                "outputFields"
            FROM "agent"
        `)
        await queryRunner.query(`
            DROP TABLE "agent"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_agent"
                RENAME TO "agent"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_projectId_externalId" ON "agent" ("projectId", "externalId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_todo_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_user_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_todo_activity" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "todoId" varchar(21) NOT NULL,
                "userId" varchar(21),
                "content" text NOT NULL,
                CONSTRAINT "fk_todo_activity_todo_id" FOREIGN KEY ("todoId") REFERENCES "todo" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_activity_user_id" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_todo_activity"(
                    "id",
                    "created",
                    "updated",
                    "todoId",
                    "userId",
                    "content"
                )
            SELECT "id",
                "created",
                "updated",
                "todoId",
                "userId",
                "content"
            FROM "todo_activity"
        `)
        await queryRunner.query(`
            DROP TABLE "todo_activity"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_todo_activity"
                RENAME TO "todo_activity"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_todo_id" ON "todo_activity" ("todoId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_user_id" ON "todo_activity" ("userId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_tool" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "type" varchar CHECK("type" IN ('PIECE', 'FLOW')) NOT NULL,
                "pieceMetadata" text,
                "flowId" varchar,
                CONSTRAINT "FK_ff5eb8d6e2b6375d0d98569d5fb" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_tool"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "type",
                    "pieceMetadata",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "type",
                "pieceMetadata",
                "flowId"
            FROM "mcp_tool"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_tool"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_tool"
                RENAME TO "mcp_tool"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "toolId" varchar(21),
                "metadata" text NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "status" varchar NOT NULL,
                CONSTRAINT "fk_mcp_run_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_mcp_run_tool_id" FOREIGN KEY ("toolId") REFERENCES "mcp_tool" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_mcp_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_run"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "projectId",
                    "toolId",
                    "metadata",
                    "input",
                    "output",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "projectId",
                "toolId",
                "metadata",
                "input",
                "output",
                "status"
            FROM "mcp_run"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_run"
                RENAME TO "mcp_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_usage" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "provider" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "model" varchar NOT NULL,
                "cost" decimal NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "metadata" text NOT NULL,
                CONSTRAINT "fk_ai_usage_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_usage"(
                    "id",
                    "created",
                    "updated",
                    "provider",
                    "platformId",
                    "model",
                    "cost",
                    "projectId",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "provider",
                "platformId",
                "model",
                "cost",
                "projectId",
                "metadata"
            FROM "ai_usage"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_usage"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_ai_usage"
                RENAME TO "ai_usage"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("platformId", "created", "projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_agent_run_project_agent_starttime"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_agent_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "output" text,
                "metadata" text,
                "steps" text NOT NULL,
                "message" varchar,
                "prompt" varchar NOT NULL,
                "startTime" datetime,
                "finishTime" datetime,
                CONSTRAINT "FK_fd5968f224bbef0787a26563dd5" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_a2642efaec1c09ebf098411314f" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_agent_run"(
                    "id",
                    "created",
                    "updated",
                    "agentId",
                    "projectId",
                    "status",
                    "output",
                    "metadata",
                    "steps",
                    "message",
                    "prompt",
                    "startTime",
                    "finishTime"
                )
            SELECT "id",
                "created",
                "updated",
                "agentId",
                "projectId",
                "status",
                "output",
                "metadata",
                "steps",
                "message",
                "prompt",
                "startTime",
                "finishTime"
            FROM "agent_run"
        `)
        await queryRunner.query(`
            DROP TABLE "agent_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_agent_run"
                RENAME TO "agent_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_agent_run_project_agent_starttime" ON "agent_run" ("projectId", "agentId", "startTime")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_agent_run_project_agent_starttime"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_run"
                RENAME TO "temporary_agent_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "agent_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "output" text,
                "metadata" text,
                "steps" text NOT NULL,
                "message" varchar,
                "prompt" varchar NOT NULL,
                "startTime" datetime,
                "finishTime" datetime
            )
        `)
        await queryRunner.query(`
            INSERT INTO "agent_run"(
                    "id",
                    "created",
                    "updated",
                    "agentId",
                    "projectId",
                    "status",
                    "output",
                    "metadata",
                    "steps",
                    "message",
                    "prompt",
                    "startTime",
                    "finishTime"
                )
            SELECT "id",
                "created",
                "updated",
                "agentId",
                "projectId",
                "status",
                "output",
                "metadata",
                "steps",
                "message",
                "prompt",
                "startTime",
                "finishTime"
            FROM "temporary_agent_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_agent_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_agent_run_project_agent_starttime" ON "agent_run" ("projectId", "agentId", "startTime")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
                RENAME TO "temporary_ai_usage"
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_usage" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "provider" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "model" varchar NOT NULL,
                "cost" decimal NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "metadata" text NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_usage"(
                    "id",
                    "created",
                    "updated",
                    "provider",
                    "platformId",
                    "model",
                    "cost",
                    "projectId",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "provider",
                "platformId",
                "model",
                "cost",
                "projectId",
                "metadata"
            FROM "temporary_ai_usage"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_usage"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("platformId", "created", "projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_mcp_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_run"
                RENAME TO "temporary_mcp_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "toolId" varchar(21),
                "metadata" text NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "status" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_run"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "projectId",
                    "toolId",
                    "metadata",
                    "input",
                    "output",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "projectId",
                "toolId",
                "metadata",
                "input",
                "output",
                "status"
            FROM "temporary_mcp_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
                RENAME TO "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_tool" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "type" varchar CHECK("type" IN ('PIECE', 'FLOW')) NOT NULL,
                "pieceMetadata" text,
                "flowId" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_tool"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "type",
                    "pieceMetadata",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "type",
                "pieceMetadata",
                "flowId"
            FROM "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_todo_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo_activity"
                RENAME TO "temporary_todo_activity"
        `)
        await queryRunner.query(`
            CREATE TABLE "todo_activity" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "todoId" varchar(21) NOT NULL,
                "userId" varchar(21),
                "content" text NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "todo_activity"(
                    "id",
                    "created",
                    "updated",
                    "todoId",
                    "userId",
                    "content"
                )
            SELECT "id",
                "created",
                "updated",
                "todoId",
                "userId",
                "content"
            FROM "temporary_todo_activity"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_todo_activity"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_user_id" ON "todo_activity" ("userId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_todo_id" ON "todo_activity" ("todoId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_agent_projectId_externalId"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
                RENAME TO "temporary_agent"
        `)
        await queryRunner.query(`
            CREATE TABLE "agent" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "profilePictureUrl" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "description" varchar NOT NULL,
                "maxSteps" integer NOT NULL,
                "mcpId" varchar NOT NULL,
                "testPrompt" varchar NOT NULL,
                "systemPrompt" varchar NOT NULL,
                "projectId" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "outputType" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "outputFields" text NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "agent"(
                    "id",
                    "created",
                    "updated",
                    "profilePictureUrl",
                    "displayName",
                    "description",
                    "maxSteps",
                    "mcpId",
                    "testPrompt",
                    "systemPrompt",
                    "projectId",
                    "platformId",
                    "outputType",
                    "externalId",
                    "outputFields"
                )
            SELECT "id",
                "created",
                "updated",
                "profilePictureUrl",
                "displayName",
                "description",
                "maxSteps",
                "mcpId",
                "testPrompt",
                "systemPrompt",
                "projectId",
                "platformId",
                "outputType",
                "externalId",
                "outputFields"
            FROM "temporary_agent"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_agent"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_projectId_externalId" ON "agent" ("projectId", "externalId")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
                RENAME TO "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "agentId" varchar,
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                "externalId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "agentId",
                    "projectId",
                    "token",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "agentId",
                "projectId",
                "token",
                "externalId"
            FROM "temporary_mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id_external_id" ON "mcp" ("projectId", "externalId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "todo"
                RENAME TO "temporary_todo"
        `)
        await queryRunner.query(`
            CREATE TABLE "todo" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "title" varchar NOT NULL,
                "description" varchar,
                "environment" varchar NOT NULL,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "createdByUserId" varchar(21),
                "flowId" varchar(21),
                "runId" varchar(21),
                "resolveUrl" varchar,
                "locked" boolean NOT NULL DEFAULT (0)
            )
        `)
        await queryRunner.query(`
            INSERT INTO "todo"(
                    "id",
                    "created",
                    "updated",
                    "title",
                    "description",
                    "environment",
                    "status",
                    "statusOptions",
                    "assigneeId",
                    "platformId",
                    "projectId",
                    "createdByUserId",
                    "flowId",
                    "runId",
                    "resolveUrl",
                    "locked"
                )
            SELECT "id",
                "created",
                "updated",
                "title",
                "description",
                "environment",
                "status",
                "statusOptions",
                "assigneeId",
                "platformId",
                "projectId",
                "createdByUserId",
                "flowId",
                "runId",
                "resolveUrl",
                "locked"
            FROM "temporary_todo"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_todo"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_platform_id" ON "todo" ("platformId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_flow_id" ON "todo" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_project_id" ON "todo" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
                RENAME TO "temporary_table_webhook"
        `)
        await queryRunner.query(`
            CREATE TABLE "table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "events",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "tableId",
                "events",
                "flowId"
            FROM "temporary_table_webhook"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_table_webhook"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_cell_project_id_field_id_record_id_unique"
        `)
        await queryRunner.query(`
            ALTER TABLE "cell"
                RENAME TO "temporary_cell"
        `)
        await queryRunner.query(`
            CREATE TABLE "cell" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "recordId" varchar(21) NOT NULL,
                "fieldId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "cell"(
                    "id",
                    "created",
                    "updated",
                    "recordId",
                    "fieldId",
                    "projectId",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "recordId",
                "fieldId",
                "projectId",
                "value"
            FROM "temporary_cell"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_cell"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_cell_project_id_field_id_record_id_unique" ON "cell" ("projectId", "fieldId", "recordId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_table_id_project_id_record_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_project_id_table_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "record"
                RENAME TO "temporary_record"
        `)
        await queryRunner.query(`
            CREATE TABLE "record" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "record"(
                    "id",
                    "created",
                    "updated",
                    "tableId",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "tableId",
                "projectId"
            FROM "temporary_record"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_record"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_table_id_project_id_record_id" ON "record" ("tableId", "projectId", "id")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "field"
                RENAME TO "temporary_field"
        `)
        await queryRunner.query(`
            CREATE TABLE "field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK(
                    "type" IN ('TEXT', 'NUMBER', 'DATE', 'STATIC_DROPDOWN')
                ) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                "data" text
            )
        `)
        await queryRunner.query(`
            INSERT INTO "field"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "type",
                    "tableId",
                    "projectId",
                    "externalId",
                    "data"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId",
                "projectId",
                "externalId",
                "data"
            FROM "temporary_field"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_field"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
                RENAME TO "temporary_table"
        `)
        await queryRunner.query(`
            CREATE TABLE "table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "agentId" varchar,
                "trigger" varchar,
                "status" varchar,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "REL_6c8e7a0da6e6cbc9b5bfc80664" UNIQUE ("agentId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "table"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "externalId",
                    "agentId",
                    "trigger",
                    "status",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "externalId",
                "agentId",
                "trigger",
                "status",
                "projectId"
            FROM "temporary_table"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
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
                "config" text NOT NULL,
                "provider" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "config",
                    "provider",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "config",
                "provider",
                "platformId"
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
                "status" varchar NOT NULL,
                "projectRoleId" varchar
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
                    "status",
                    "projectRoleId"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "email",
                "projectId",
                "status",
                "projectRoleId"
            FROM "temporary_user_invitation"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user_invitation"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
                RENAME TO "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE TABLE "issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "lastOccurrence" datetime NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                "stepName" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "lastOccurrence",
                    "flowVersionId",
                    "stepName"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "lastOccurrence",
                "flowVersionId",
                "stepName"
            FROM "temporary_issue"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
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
                "cloudAuthEnabled" boolean NOT NULL DEFAULT (1),
                "filteredPieceNames" text NOT NULL,
                "filteredPieceBehavior" varchar CHECK(
                    "filteredPieceBehavior" IN ('ALLOWED', 'BLOCKED')
                ) NOT NULL,
                "allowedAuthDomains" text NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" text NOT NULL,
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
                    "cloudAuthEnabled",
                    "filteredPieceNames",
                    "filteredPieceBehavior",
                    "allowedAuthDomains",
                    "enforceAllowedAuthDomains",
                    "emailAuthEnabled",
                    "federatedAuthProviders",
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
                "cloudAuthEnabled",
                "filteredPieceNames",
                "filteredPieceBehavior",
                "allowedAuthDomains",
                "enforceAllowedAuthDomains",
                "emailAuthEnabled",
                "federatedAuthProviders",
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
                "i18n" text,
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
                    "archiveId",
                    "i18n"
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
                "archiveId",
                "i18n"
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
                "projectId" varchar(21) NOT NULL,
                "displayOrder" integer NOT NULL DEFAULT (0)
            )
        `)
        await queryRunner.query(`
            INSERT INTO "folder"(
                    "id",
                    "created",
                    "updated",
                    "displayName",
                    "projectId",
                    "displayOrder"
                )
            SELECT "id",
                "created",
                "updated",
                "displayName",
                "projectId",
                "displayOrder"
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
            DROP INDEX "idx_app_connection_platform_id_and_external_id"
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
                "value" text NOT NULL,
                "metadata" text
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
                    "value",
                    "metadata"
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
                "value",
                "metadata"
            FROM "temporary_app_connection"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_app_connection"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id_and_external_id" ON "app_connection" ("platformId", "externalId")
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
                "lastChangelogDismissed" datetime,
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
                    "lastChangelogDismissed",
                    "platformRole",
                    "identityId",
                    "externalId",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "status",
                "lastChangelogDismissed",
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
                "releasesEnabled" boolean NOT NULL DEFAULT (0),
                "metadata" text
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
                    "releasesEnabled",
                    "metadata"
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
                "releasesEnabled",
                "metadata"
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
            DROP INDEX "idx_run_parent_run_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_run_flow_failed_step"
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
                "parentRunId" varchar(21),
                "failParentOnFailure" boolean NOT NULL DEFAULT (1),
                "status" varchar NOT NULL,
                "tags" text,
                "duration" integer,
                "tasks" integer,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "pauseMetadata" text,
                "failedStepName" varchar,
                "stepNameToTest" varchar
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
                    "parentRunId",
                    "failParentOnFailure",
                    "status",
                    "tags",
                    "duration",
                    "tasks",
                    "startTime",
                    "finishTime",
                    "pauseMetadata",
                    "failedStepName",
                    "stepNameToTest"
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
                "parentRunId",
                "failParentOnFailure",
                "status",
                "tags",
                "duration",
                "tasks",
                "startTime",
                "finishTime",
                "pauseMetadata",
                "failedStepName",
                "stepNameToTest"
            FROM "temporary_flow_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_parent_run_id" ON "flow_run" ("parentRunId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_run_flow_failed_step" ON "flow_run" ("flowId", "failedStepName")
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
            DROP INDEX "idx_flow_version_schema_version"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id_created_desc"
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
                "connectionIds" text NOT NULL,
                "agentIds" text NOT NULL,
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
                    "connectionIds",
                    "agentIds",
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
                "connectionIds",
                "agentIds",
                "updatedBy",
                "valid",
                "state"
            FROM "temporary_flow_version"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow_version"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_schema_version" ON "flow_version" ("schemaVersion")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id_created_desc" ON "flow_version" ("flowId", "created")
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
                "handshakeConfiguration" text,
                "schedule" text,
                "externalId" varchar NOT NULL,
                "publishedVersionId" varchar(21),
                "metadata" text,
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
                    "handshakeConfiguration",
                    "schedule",
                    "externalId",
                    "publishedVersionId",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "folderId",
                "status",
                "handshakeConfiguration",
                "schedule",
                "externalId",
                "publishedVersionId",
                "metadata"
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
            DROP INDEX "idx_agent_run_project_agent_starttime"
        `)
        await queryRunner.query(`
            DROP TABLE "agent_run"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_usage"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_mcp_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_run"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_tool"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_todo_id"
        `)
        await queryRunner.query(`
            DROP TABLE "todo_activity"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_agent_projectId_externalId"
        `)
        await queryRunner.query(`
            DROP TABLE "agent"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id_external_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "todo"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_identity_email"
        `)
        await queryRunner.query(`
            DROP TABLE "user_identity"
        `)
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_cell_project_id_field_id_record_id_unique"
        `)
        await queryRunner.query(`
            DROP TABLE "cell"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_table_id_project_id_record_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_project_id_table_id"
        `)
        await queryRunner.query(`
            DROP TABLE "record"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `)
        await queryRunner.query(`
            DROP TABLE "field"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            DROP TABLE "table"
        `)
        await queryRunner.query(`
            DROP TABLE "project_role"
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
            DROP TABLE "alert"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            DROP TABLE "issue"
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
            DROP INDEX "idx_app_connection_platform_id_and_external_id"
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
            DROP INDEX "idx_run_parent_run_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_run_flow_failed_step"
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
            DROP INDEX "idx_flow_version_schema_version"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id_created_desc"
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
