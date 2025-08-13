import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSettingsAndSummaryAgentRunSqlite1754922630313 implements MigrationInterface {
    name = 'AddSettingsAndSummaryAgentRunSqlite1754922630313'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "agent_settings" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" varchar(21) NOT NULL,
                "aiMode" boolean NOT NULL,
                "triggerOnNewRow" boolean NOT NULL,
                "triggerOnFieldUpdate" boolean NOT NULL,
                "allowAgentCreateColumns" boolean NOT NULL,
                "limitColumnEditing" boolean NOT NULL,
                "editableColumns" text NOT NULL,
                CONSTRAINT "REL_6c1096900a00fab05112ab55a9" UNIQUE ("agentId")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_settings_agent_id" ON "agent_settings" ("agentId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_logs_file_id"
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
                "status" varchar NOT NULL,
                "tasks" integer,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "pauseMetadata" text,
                "tags" text,
                "duration" integer,
                "failedStepName" varchar,
                "parentRunId" varchar(21),
                "failParentOnFailure" boolean NOT NULL DEFAULT (1),
                CONSTRAINT "fk_flow_run_logs_file_id" FOREIGN KEY ("logsFileId") REFERENCES "file" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                    "tasks",
                    "startTime",
                    "finishTime",
                    "pauseMetadata",
                    "tags",
                    "duration",
                    "failedStepName",
                    "parentRunId",
                    "failParentOnFailure"
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
                "tasks",
                "startTime",
                "finishTime",
                "pauseMetadata",
                "tags",
                "duration",
                "failedStepName",
                "parentRunId",
                "failParentOnFailure"
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
            CREATE INDEX "idx_run_flow_id" ON "flow_run" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
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
            CREATE INDEX "idx_flow_run_flow_failed_step" ON "flow_run" ("flowId", "failedStepName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_parent_run_id" ON "flow_run" ("parentRunId")
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
                "steps" text NOT NULL,
                "message" varchar,
                "startTime" datetime,
                "finishTime" datetime,
                "prompt" varchar NOT NULL,
                "metadata" text,
                "title" varchar,
                "summary" varchar,
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
                    "steps",
                    "message",
                    "startTime",
                    "finishTime",
                    "prompt",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "agentId",
                "projectId",
                "status",
                "output",
                "steps",
                "message",
                "startTime",
                "finishTime",
                "prompt",
                "metadata"
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
        await queryRunner.query(`
            DROP INDEX "idx_agent_settings_agent_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_agent_settings" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" varchar(21) NOT NULL,
                "aiMode" boolean NOT NULL,
                "triggerOnNewRow" boolean NOT NULL,
                "triggerOnFieldUpdate" boolean NOT NULL,
                "allowAgentCreateColumns" boolean NOT NULL,
                "limitColumnEditing" boolean NOT NULL,
                "editableColumns" text NOT NULL,
                CONSTRAINT "REL_6c1096900a00fab05112ab55a9" UNIQUE ("agentId"),
                CONSTRAINT "fk_agent_settings_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_agent_settings"(
                    "id",
                    "created",
                    "updated",
                    "agentId",
                    "aiMode",
                    "triggerOnNewRow",
                    "triggerOnFieldUpdate",
                    "allowAgentCreateColumns",
                    "limitColumnEditing",
                    "editableColumns"
                )
            SELECT "id",
                "created",
                "updated",
                "agentId",
                "aiMode",
                "triggerOnNewRow",
                "triggerOnFieldUpdate",
                "allowAgentCreateColumns",
                "limitColumnEditing",
                "editableColumns"
            FROM "agent_settings"
        `)
        await queryRunner.query(`
            DROP TABLE "agent_settings"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_agent_settings"
                RENAME TO "agent_settings"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_settings_agent_id" ON "agent_settings" ("agentId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_agent_settings_agent_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_settings"
                RENAME TO "temporary_agent_settings"
        `)
        await queryRunner.query(`
            CREATE TABLE "agent_settings" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" varchar(21) NOT NULL,
                "aiMode" boolean NOT NULL,
                "triggerOnNewRow" boolean NOT NULL,
                "triggerOnFieldUpdate" boolean NOT NULL,
                "allowAgentCreateColumns" boolean NOT NULL,
                "limitColumnEditing" boolean NOT NULL,
                "editableColumns" text NOT NULL,
                CONSTRAINT "REL_6c1096900a00fab05112ab55a9" UNIQUE ("agentId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "agent_settings"(
                    "id",
                    "created",
                    "updated",
                    "agentId",
                    "aiMode",
                    "triggerOnNewRow",
                    "triggerOnFieldUpdate",
                    "allowAgentCreateColumns",
                    "limitColumnEditing",
                    "editableColumns"
                )
            SELECT "id",
                "created",
                "updated",
                "agentId",
                "aiMode",
                "triggerOnNewRow",
                "triggerOnFieldUpdate",
                "allowAgentCreateColumns",
                "limitColumnEditing",
                "editableColumns"
            FROM "temporary_agent_settings"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_agent_settings"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_settings_agent_id" ON "agent_settings" ("agentId")
        `)
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
                "steps" text NOT NULL,
                "message" varchar,
                "startTime" datetime,
                "finishTime" datetime,
                "prompt" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "FK_fd5968f224bbef0787a26563dd5" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_a2642efaec1c09ebf098411314f" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                    "steps",
                    "message",
                    "startTime",
                    "finishTime",
                    "prompt",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "agentId",
                "projectId",
                "status",
                "output",
                "steps",
                "message",
                "startTime",
                "finishTime",
                "prompt",
                "metadata"
            FROM "temporary_agent_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_agent_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_agent_run_project_agent_starttime" ON "agent_run" ("projectId", "agentId", "startTime")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_parent_run_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_run_flow_failed_step"
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
            DROP INDEX "idx_run_logs_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_flow_id"
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
                "tasks" integer,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "pauseMetadata" text,
                "tags" text,
                "duration" integer,
                "failedStepName" varchar,
                "parentRunId" varchar(21),
                "failParentOnFailure" boolean NOT NULL DEFAULT (1),
                "stepNameToTest" varchar,
                CONSTRAINT "fk_flow_run_logs_file_id" FOREIGN KEY ("logsFileId") REFERENCES "file" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                    "tasks",
                    "startTime",
                    "finishTime",
                    "pauseMetadata",
                    "tags",
                    "duration",
                    "failedStepName",
                    "parentRunId",
                    "failParentOnFailure"
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
                "tasks",
                "startTime",
                "finishTime",
                "pauseMetadata",
                "tags",
                "duration",
                "failedStepName",
                "parentRunId",
                "failParentOnFailure"
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
            CREATE INDEX "idx_run_logs_file_id" ON "flow_run" ("logsFileId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_flow_id" ON "flow_run" ("flowId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_agent_settings_agent_id"
        `)
        await queryRunner.query(`
            DROP TABLE "agent_settings"
        `)
    }

}
