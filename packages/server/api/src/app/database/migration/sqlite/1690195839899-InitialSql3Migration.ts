import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class InitialSql3Migration1690195839899 implements MigrationInterface {
    name = 'InitialSql3Migration1690195839899'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info(`Running migration ${this.name}`)
        await queryRunner.query(
            'CREATE TABLE "trigger_event" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "projectId" varchar(21) NOT NULL, "sourceName" varchar NOT NULL, "payload" text)',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_trigger_event_flow_id" ON "trigger_event" ("flowId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "flow_instance" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "flowId" varchar(21) NOT NULL, "flowVersionId" varchar(21) NOT NULL, "status" varchar NOT NULL, "schedule" text, CONSTRAINT "REL_cb897f5e48cc3cba1418966326" UNIQUE ("flowId"), CONSTRAINT "REL_ec72f514c21734fb7a08797d75" UNIQUE ("flowVersionId"))',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_flow_instance_project_id_flow_id" ON "flow_instance" ("projectId", "flowId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "app_event_routing" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "appName" varchar NOT NULL, "projectId" varchar(21) NOT NULL, "flowId" varchar(21) NOT NULL, "identifierValue" varchar NOT NULL, "event" varchar NOT NULL)',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_app_event_routing_flow_id" ON "app_event_routing" ("flowId") ',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_event_project_id_appName_identifier_value_event" ON "app_event_routing" ("appName", "projectId", "identifierValue", "event") ',
        )
        await queryRunner.query(
            'CREATE TABLE "file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21), "data" blob NOT NULL)',
        )
        await queryRunner.query(
            'CREATE TABLE "flag" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "value" text NOT NULL)',
        )
        await queryRunner.query(
            'CREATE TABLE "flow" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "folderId" varchar(21))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "flow_version" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "displayName" varchar NOT NULL, "trigger" text, "updatedBy" varchar, "valid" boolean NOT NULL, "state" varchar NOT NULL)',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "flow_run" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "flowId" varchar(21) NOT NULL, "flowVersionId" varchar(21) NOT NULL, "environment" varchar, "flowDisplayName" varchar NOT NULL, "logsFileId" varchar(21), "status" varchar NOT NULL, "tasks" integer, "startTime" datetime NOT NULL, "finishTime" datetime, "pauseMetadata" text)',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_created_desc" ON "flow_run" ("projectId", "environment", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("projectId", "environment", "status", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "status", "created") ',
        )
        await queryRunner.query(
            'CREATE TABLE "project" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "ownerId" varchar(21) NOT NULL, "displayName" varchar NOT NULL, "notifyStatus" varchar NOT NULL)',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "store-entry" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "key" varchar NOT NULL, "projectId" varchar(21) NOT NULL, "value" text)',
        )
        await queryRunner.query(
            'CREATE TABLE "user" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "email" varchar NOT NULL, "firstName" varchar NOT NULL, "lastName" varchar NOT NULL, "password" varchar NOT NULL, "status" varchar NOT NULL, "trackEvents" boolean, "newsLetter" boolean, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"))',
        )
        await queryRunner.query(
            'CREATE TABLE "app_connection" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "appName" varchar NOT NULL, "projectId" varchar(21) NOT NULL, "value" text NOT NULL)',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name") ',
        )
        await queryRunner.query(
            'CREATE TABLE "webhook_simulation" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "projectId" varchar(21) NOT NULL)',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_webhook_simulation_flow_id" ON "webhook_simulation" ("flowId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "folder" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "displayName" varchar NOT NULL, "projectId" varchar(21) NOT NULL)',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_folder_project_id" ON "folder" ("projectId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "piece_metadata" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "displayName" varchar NOT NULL, "logoUrl" varchar NOT NULL, "description" varchar, "projectId" varchar, "version" varchar NOT NULL, "minimumSupportedRelease" varchar NOT NULL, "maximumSupportedRelease" varchar NOT NULL, "auth" text, "actions" text NOT NULL, "triggers" text NOT NULL)',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId") ',
        )
        await queryRunner.query('DROP INDEX "idx_trigger_event_flow_id"')
        await queryRunner.query(
            'CREATE TABLE "temporary_trigger_event" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "projectId" varchar(21) NOT NULL, "sourceName" varchar NOT NULL, "payload" text, CONSTRAINT "fk_trigger_event_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "fk_trigger_event_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_trigger_event"("id", "created", "updated", "flowId", "projectId", "sourceName", "payload") SELECT "id", "created", "updated", "flowId", "projectId", "sourceName", "payload" FROM "trigger_event"',
        )
        await queryRunner.query('DROP TABLE "trigger_event"')
        await queryRunner.query(
            'ALTER TABLE "temporary_trigger_event" RENAME TO "trigger_event"',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_trigger_event_flow_id" ON "trigger_event" ("flowId") ',
        )
        await queryRunner.query(
            'DROP INDEX "idx_flow_instance_project_id_flow_id"',
        )
        await queryRunner.query(
            'CREATE TABLE "temporary_flow_instance" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "flowId" varchar(21) NOT NULL, "flowVersionId" varchar(21) NOT NULL, "status" varchar NOT NULL, "schedule" text, CONSTRAINT "REL_cb897f5e48cc3cba1418966326" UNIQUE ("flowId"), CONSTRAINT "REL_ec72f514c21734fb7a08797d75" UNIQUE ("flowVersionId"), CONSTRAINT "fk_flow_instance_flow" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "fk_flow_instance_flow_version" FOREIGN KEY ("flowVersionId") REFERENCES "flow_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_flow_instance"("id", "created", "updated", "projectId", "flowId", "flowVersionId", "status", "schedule") SELECT "id", "created", "updated", "projectId", "flowId", "flowVersionId", "status", "schedule" FROM "flow_instance"',
        )
        await queryRunner.query('DROP TABLE "flow_instance"')
        await queryRunner.query(
            'ALTER TABLE "temporary_flow_instance" RENAME TO "flow_instance"',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_flow_instance_project_id_flow_id" ON "flow_instance" ("projectId", "flowId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "temporary_file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21), "data" blob NOT NULL, CONSTRAINT "fk_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_file"("id", "created", "updated", "projectId", "data") SELECT "id", "created", "updated", "projectId", "data" FROM "file"',
        )
        await queryRunner.query('DROP TABLE "file"')
        await queryRunner.query('ALTER TABLE "temporary_file" RENAME TO "file"')
        await queryRunner.query('DROP INDEX "idx_flow_project_id"')
        await queryRunner.query('DROP INDEX "idx_flow_folder_id"')
        await queryRunner.query(
            'CREATE TABLE "temporary_flow" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "folderId" varchar(21), CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_flow"("id", "created", "updated", "projectId", "folderId") SELECT "id", "created", "updated", "projectId", "folderId" FROM "flow"',
        )
        await queryRunner.query('DROP TABLE "flow"')
        await queryRunner.query('ALTER TABLE "temporary_flow" RENAME TO "flow"')
        await queryRunner.query(
            'CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId") ',
        )
        await queryRunner.query('DROP INDEX "idx_flow_version_flow_id"')
        await queryRunner.query(
            'CREATE TABLE "temporary_flow_version" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "displayName" varchar NOT NULL, "trigger" text, "updatedBy" varchar, "valid" boolean NOT NULL, "state" varchar NOT NULL, CONSTRAINT "fk_updated_by_user_flow" FOREIGN KEY ("updatedBy") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "fk_flow_version_flow" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_flow_version"("id", "created", "updated", "flowId", "displayName", "trigger", "updatedBy", "valid", "state") SELECT "id", "created", "updated", "flowId", "displayName", "trigger", "updatedBy", "valid", "state" FROM "flow_version"',
        )
        await queryRunner.query('DROP TABLE "flow_version"')
        await queryRunner.query(
            'ALTER TABLE "temporary_flow_version" RENAME TO "flow_version"',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId") ',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'CREATE TABLE "temporary_flow_run" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "flowId" varchar(21) NOT NULL, "flowVersionId" varchar(21) NOT NULL, "environment" varchar, "flowDisplayName" varchar NOT NULL, "logsFileId" varchar(21), "status" varchar NOT NULL, "tasks" integer, "startTime" datetime NOT NULL, "finishTime" datetime, "pauseMetadata" text, CONSTRAINT "fk_flow_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "fk_flow_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_flow_run"("id", "created", "updated", "projectId", "flowId", "flowVersionId", "environment", "flowDisplayName", "logsFileId", "status", "tasks", "startTime", "finishTime", "pauseMetadata") SELECT "id", "created", "updated", "projectId", "flowId", "flowVersionId", "environment", "flowDisplayName", "logsFileId", "status", "tasks", "startTime", "finishTime", "pauseMetadata" FROM "flow_run"',
        )
        await queryRunner.query('DROP TABLE "flow_run"')
        await queryRunner.query(
            'ALTER TABLE "temporary_flow_run" RENAME TO "flow_run"',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_created_desc" ON "flow_run" ("projectId", "environment", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("projectId", "environment", "status", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "status", "created") ',
        )
        await queryRunner.query('DROP INDEX "idx_project_owner_id"')
        await queryRunner.query(
            'CREATE TABLE "temporary_project" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "ownerId" varchar(21) NOT NULL, "displayName" varchar NOT NULL, "notifyStatus" varchar NOT NULL, CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_project"("id", "created", "updated", "ownerId", "displayName", "notifyStatus") SELECT "id", "created", "updated", "ownerId", "displayName", "notifyStatus" FROM "project"',
        )
        await queryRunner.query('DROP TABLE "project"')
        await queryRunner.query(
            'ALTER TABLE "temporary_project" RENAME TO "project"',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId") ',
        )
        await queryRunner.query(
            'DROP INDEX "idx_app_connection_project_id_and_name"',
        )
        await queryRunner.query(
            'CREATE TABLE "temporary_app_connection" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "appName" varchar NOT NULL, "projectId" varchar(21) NOT NULL, "value" text NOT NULL, CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_app_connection"("id", "created", "updated", "name", "appName", "projectId", "value") SELECT "id", "created", "updated", "name", "appName", "projectId", "value" FROM "app_connection"',
        )
        await queryRunner.query('DROP TABLE "app_connection"')
        await queryRunner.query(
            'ALTER TABLE "temporary_app_connection" RENAME TO "app_connection"',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name") ',
        )
        await queryRunner.query('DROP INDEX "idx_folder_project_id"')
        await queryRunner.query(
            'CREATE TABLE "temporary_folder" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "displayName" varchar NOT NULL, "projectId" varchar(21) NOT NULL, CONSTRAINT "fk_folder_project" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_folder"("id", "created", "updated", "displayName", "projectId") SELECT "id", "created", "updated", "displayName", "projectId" FROM "folder"',
        )
        await queryRunner.query('DROP TABLE "folder"')
        await queryRunner.query(
            'ALTER TABLE "temporary_folder" RENAME TO "folder"',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_folder_project_id" ON "folder" ("projectId") ',
        )
        await queryRunner.query(
            'DROP INDEX "idx_piece_metadata_name_project_id_version"',
        )
        await queryRunner.query(
            'CREATE TABLE "temporary_piece_metadata" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "displayName" varchar NOT NULL, "logoUrl" varchar NOT NULL, "description" varchar, "projectId" varchar, "version" varchar NOT NULL, "minimumSupportedRelease" varchar NOT NULL, "maximumSupportedRelease" varchar NOT NULL, "auth" text, "actions" text NOT NULL, "triggers" text NOT NULL, CONSTRAINT "fk_piece_metadata_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_piece_metadata"("id", "created", "updated", "name", "displayName", "logoUrl", "description", "projectId", "version", "minimumSupportedRelease", "maximumSupportedRelease", "auth", "actions", "triggers") SELECT "id", "created", "updated", "name", "displayName", "logoUrl", "description", "projectId", "version", "minimumSupportedRelease", "maximumSupportedRelease", "auth", "actions", "triggers" FROM "piece_metadata"',
        )
        await queryRunner.query('DROP TABLE "piece_metadata"')
        await queryRunner.query(
            'ALTER TABLE "temporary_piece_metadata" RENAME TO "piece_metadata"',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId") ',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP INDEX "idx_piece_metadata_name_project_id_version"',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" RENAME TO "temporary_piece_metadata"',
        )
        await queryRunner.query(
            'CREATE TABLE "piece_metadata" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "displayName" varchar NOT NULL, "logoUrl" varchar NOT NULL, "description" varchar, "projectId" varchar, "version" varchar NOT NULL, "minimumSupportedRelease" varchar NOT NULL, "maximumSupportedRelease" varchar NOT NULL, "auth" text, "actions" text NOT NULL, "triggers" text NOT NULL)',
        )
        await queryRunner.query(
            'INSERT INTO "piece_metadata"("id", "created", "updated", "name", "displayName", "logoUrl", "description", "projectId", "version", "minimumSupportedRelease", "maximumSupportedRelease", "auth", "actions", "triggers") SELECT "id", "created", "updated", "name", "displayName", "logoUrl", "description", "projectId", "version", "minimumSupportedRelease", "maximumSupportedRelease", "auth", "actions", "triggers" FROM "temporary_piece_metadata"',
        )
        await queryRunner.query('DROP TABLE "temporary_piece_metadata"')
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId") ',
        )
        await queryRunner.query('DROP INDEX "idx_folder_project_id"')
        await queryRunner.query(
            'ALTER TABLE "folder" RENAME TO "temporary_folder"',
        )
        await queryRunner.query(
            'CREATE TABLE "folder" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "displayName" varchar NOT NULL, "projectId" varchar(21) NOT NULL)',
        )
        await queryRunner.query(
            'INSERT INTO "folder"("id", "created", "updated", "displayName", "projectId") SELECT "id", "created", "updated", "displayName", "projectId" FROM "temporary_folder"',
        )
        await queryRunner.query('DROP TABLE "temporary_folder"')
        await queryRunner.query(
            'CREATE INDEX "idx_folder_project_id" ON "folder" ("projectId") ',
        )
        await queryRunner.query(
            'DROP INDEX "idx_app_connection_project_id_and_name"',
        )
        await queryRunner.query(
            'ALTER TABLE "app_connection" RENAME TO "temporary_app_connection"',
        )
        await queryRunner.query(
            'CREATE TABLE "app_connection" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "appName" varchar NOT NULL, "projectId" varchar(21) NOT NULL, "value" text NOT NULL)',
        )
        await queryRunner.query(
            'INSERT INTO "app_connection"("id", "created", "updated", "name", "appName", "projectId", "value") SELECT "id", "created", "updated", "name", "appName", "projectId", "value" FROM "temporary_app_connection"',
        )
        await queryRunner.query('DROP TABLE "temporary_app_connection"')
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name") ',
        )
        await queryRunner.query('DROP INDEX "idx_project_owner_id"')
        await queryRunner.query(
            'ALTER TABLE "project" RENAME TO "temporary_project"',
        )
        await queryRunner.query(
            'CREATE TABLE "project" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "ownerId" varchar(21) NOT NULL, "displayName" varchar NOT NULL, "notifyStatus" varchar NOT NULL)',
        )
        await queryRunner.query(
            'INSERT INTO "project"("id", "created", "updated", "ownerId", "displayName", "notifyStatus") SELECT "id", "created", "updated", "ownerId", "displayName", "notifyStatus" FROM "temporary_project"',
        )
        await queryRunner.query('DROP TABLE "temporary_project"')
        await queryRunner.query(
            'CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId") ',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_created_desc"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" RENAME TO "temporary_flow_run"',
        )
        await queryRunner.query(
            'CREATE TABLE "flow_run" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "flowId" varchar(21) NOT NULL, "flowVersionId" varchar(21) NOT NULL, "environment" varchar, "flowDisplayName" varchar NOT NULL, "logsFileId" varchar(21), "status" varchar NOT NULL, "tasks" integer, "startTime" datetime NOT NULL, "finishTime" datetime, "pauseMetadata" text)',
        )
        await queryRunner.query(
            'INSERT INTO "flow_run"("id", "created", "updated", "projectId", "flowId", "flowVersionId", "environment", "flowDisplayName", "logsFileId", "status", "tasks", "startTime", "finishTime", "pauseMetadata") SELECT "id", "created", "updated", "projectId", "flowId", "flowVersionId", "environment", "flowDisplayName", "logsFileId", "status", "tasks", "startTime", "finishTime", "pauseMetadata" FROM "temporary_flow_run"',
        )
        await queryRunner.query('DROP TABLE "temporary_flow_run"')
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "status", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("projectId", "environment", "status", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_created_desc" ON "flow_run" ("projectId", "environment", "created") ',
        )
        await queryRunner.query('DROP INDEX "idx_flow_version_flow_id"')
        await queryRunner.query(
            'ALTER TABLE "flow_version" RENAME TO "temporary_flow_version"',
        )
        await queryRunner.query(
            'CREATE TABLE "flow_version" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "displayName" varchar NOT NULL, "trigger" text, "updatedBy" varchar, "valid" boolean NOT NULL, "state" varchar NOT NULL)',
        )
        await queryRunner.query(
            'INSERT INTO "flow_version"("id", "created", "updated", "flowId", "displayName", "trigger", "updatedBy", "valid", "state") SELECT "id", "created", "updated", "flowId", "displayName", "trigger", "updatedBy", "valid", "state" FROM "temporary_flow_version"',
        )
        await queryRunner.query('DROP TABLE "temporary_flow_version"')
        await queryRunner.query(
            'CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId") ',
        )
        await queryRunner.query('DROP INDEX "idx_flow_folder_id"')
        await queryRunner.query('DROP INDEX "idx_flow_project_id"')
        await queryRunner.query('ALTER TABLE "flow" RENAME TO "temporary_flow"')
        await queryRunner.query(
            'CREATE TABLE "flow" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "folderId" varchar(21))',
        )
        await queryRunner.query(
            'INSERT INTO "flow"("id", "created", "updated", "projectId", "folderId") SELECT "id", "created", "updated", "projectId", "folderId" FROM "temporary_flow"',
        )
        await queryRunner.query('DROP TABLE "temporary_flow"')
        await queryRunner.query(
            'CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId") ',
        )
        await queryRunner.query('ALTER TABLE "file" RENAME TO "temporary_file"')
        await queryRunner.query(
            'CREATE TABLE "file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21), "data" blob NOT NULL)',
        )
        await queryRunner.query(
            'INSERT INTO "file"("id", "created", "updated", "projectId", "data") SELECT "id", "created", "updated", "projectId", "data" FROM "temporary_file"',
        )
        await queryRunner.query('DROP TABLE "temporary_file"')
        await queryRunner.query(
            'DROP INDEX "idx_flow_instance_project_id_flow_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_instance" RENAME TO "temporary_flow_instance"',
        )
        await queryRunner.query(
            'CREATE TABLE "flow_instance" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "flowId" varchar(21) NOT NULL, "flowVersionId" varchar(21) NOT NULL, "status" varchar NOT NULL, "schedule" text, CONSTRAINT "REL_cb897f5e48cc3cba1418966326" UNIQUE ("flowId"), CONSTRAINT "REL_ec72f514c21734fb7a08797d75" UNIQUE ("flowVersionId"))',
        )
        await queryRunner.query(
            'INSERT INTO "flow_instance"("id", "created", "updated", "projectId", "flowId", "flowVersionId", "status", "schedule") SELECT "id", "created", "updated", "projectId", "flowId", "flowVersionId", "status", "schedule" FROM "temporary_flow_instance"',
        )
        await queryRunner.query('DROP TABLE "temporary_flow_instance"')
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_flow_instance_project_id_flow_id" ON "flow_instance" ("projectId", "flowId") ',
        )
        await queryRunner.query('DROP INDEX "idx_trigger_event_flow_id"')
        await queryRunner.query(
            'ALTER TABLE "trigger_event" RENAME TO "temporary_trigger_event"',
        )
        await queryRunner.query(
            'CREATE TABLE "trigger_event" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "flowId" varchar(21) NOT NULL, "projectId" varchar(21) NOT NULL, "sourceName" varchar NOT NULL, "payload" text)',
        )
        await queryRunner.query(
            'INSERT INTO "trigger_event"("id", "created", "updated", "flowId", "projectId", "sourceName", "payload") SELECT "id", "created", "updated", "flowId", "projectId", "sourceName", "payload" FROM "temporary_trigger_event"',
        )
        await queryRunner.query('DROP TABLE "temporary_trigger_event"')
        await queryRunner.query(
            'CREATE INDEX "idx_trigger_event_flow_id" ON "trigger_event" ("flowId") ',
        )
        await queryRunner.query(
            'DROP INDEX "idx_piece_metadata_name_project_id_version"',
        )
        await queryRunner.query('DROP TABLE "piece_metadata"')
        await queryRunner.query('DROP INDEX "idx_folder_project_id"')
        await queryRunner.query('DROP TABLE "folder"')
        await queryRunner.query('DROP INDEX "idx_webhook_simulation_flow_id"')
        await queryRunner.query('DROP TABLE "webhook_simulation"')
        await queryRunner.query(
            'DROP INDEX "idx_app_connection_project_id_and_name"',
        )
        await queryRunner.query('DROP TABLE "app_connection"')
        await queryRunner.query('DROP TABLE "user"')
        await queryRunner.query('DROP TABLE "store-entry"')
        await queryRunner.query('DROP INDEX "idx_project_owner_id"')
        await queryRunner.query('DROP TABLE "project"')
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_created_desc"',
        )
        await queryRunner.query('DROP TABLE "flow_run"')
        await queryRunner.query('DROP INDEX "idx_flow_version_flow_id"')
        await queryRunner.query('DROP TABLE "flow_version"')
        await queryRunner.query('DROP INDEX "idx_flow_folder_id"')
        await queryRunner.query('DROP INDEX "idx_flow_project_id"')
        await queryRunner.query('DROP TABLE "flow"')
        await queryRunner.query('DROP TABLE "flag"')
        await queryRunner.query('DROP TABLE "file"')
        await queryRunner.query(
            'DROP INDEX "idx_app_event_project_id_appName_identifier_value_event"',
        )
        await queryRunner.query('DROP INDEX "idx_app_event_routing_flow_id"')
        await queryRunner.query('DROP TABLE "app_event_routing"')
        await queryRunner.query(
            'DROP INDEX "idx_flow_instance_project_id_flow_id"',
        )
        await queryRunner.query('DROP TABLE "flow_instance"')
        await queryRunner.query('DROP INDEX "idx_trigger_event_flow_id"')
        await queryRunner.query('DROP TABLE "trigger_event"')
    }
}
