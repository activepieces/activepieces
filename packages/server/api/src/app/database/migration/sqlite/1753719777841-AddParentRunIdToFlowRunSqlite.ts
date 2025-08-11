import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddParentRunIdToFlowRunSqlite1753719777841 implements MigrationInterface {
    name = 'AddParentRunIdToFlowRunSqlite1753719777841'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                    "failedStepName"
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
                "failedStepName"
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
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_usage" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "provider" varchar NOT NULL,
                "model" varchar NOT NULL,
                "cost" decimal NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar NOT NULL,
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
                    "model",
                    "cost",
                    "projectId",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "provider",
                "model",
                "cost",
                "projectId",
                "platformId"
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
            CREATE INDEX "idx_run_parent_run_id" ON "flow_run" ("parentRunId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_run_parent_run_id"
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
                "model" varchar NOT NULL,
                "cost" decimal NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar NOT NULL,
                CONSTRAINT "fk_ai_usage_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_usage"(
                    "id",
                    "created",
                    "updated",
                    "provider",
                    "model",
                    "cost",
                    "projectId",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "provider",
                "model",
                "cost",
                "projectId",
                "platformId"
            FROM "temporary_ai_usage"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_usage"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("platformId", "created", "projectId")
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
                    "failedStepName"
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
                "failedStepName"
            FROM "temporary_flow_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow_run"
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
    }

}
