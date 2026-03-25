import { MigrationInterface, QueryRunner } from 'typeorm'

export class LogFileRelationWithFlowRunSqlite1725637505836 implements MigrationInterface {
    name = 'LogFileRelationWithFlowRunSqlite1725637505836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM "file" WHERE "type" = \'UNKNOWN\' OR "type" = \'CODE_SOURCE\'')
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
                "terminationReason" varchar CHECK("terminationReason" IN ('STOPPED_BY_HOOK')),
                "duration" integer,
                CONSTRAINT "fk_flow_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
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
                    "tasks",
                    "startTime",
                    "finishTime",
                    "pauseMetadata",
                    "tags",
                    "terminationReason",
                    "duration"
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
                "terminationReason",
                "duration"
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                "terminationReason" varchar CHECK("terminationReason" IN ('STOPPED_BY_HOOK')),
                "duration" integer,
                CONSTRAINT "fk_flow_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                    "terminationReason",
                    "duration"
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
                "terminationReason",
                "duration"
            FROM "temporary_flow_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow_run"
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
    }

}
