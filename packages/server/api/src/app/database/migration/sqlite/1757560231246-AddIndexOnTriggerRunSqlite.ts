import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexOnTriggerRunSqlite1757560231246 implements MigrationInterface {
    name = 'AddIndexOnTriggerRunSqlite1757560231246'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_job_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_created_piece_name_platform_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_trigger_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "payloadFileId" varchar,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "error" varchar,
                "status" varchar NOT NULL,
                "triggerSourceId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "flowId" varchar(21),
                "jobId" varchar NOT NULL,
                CONSTRAINT "REL_b76b435f583d4e68c892a7fafa" UNIQUE ("payloadFileId"),
                CONSTRAINT "fk_trigger_run_trigger_source_id" FOREIGN KEY ("triggerSourceId") REFERENCES "trigger_source" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)

        await queryRunner.query(`
            DROP TABLE "trigger_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_trigger_run"
                RENAME TO "trigger_run"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_run_job_id" ON "trigger_run" ("jobId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_created_piece_name_platform_id" ON "trigger_run" ("created", "platformId", "pieceName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_job_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_created_piece_name_platform_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_trigger_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "payloadFileId" varchar,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "error" varchar,
                "status" varchar NOT NULL,
                "triggerSourceId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "jobId" varchar NOT NULL,
                CONSTRAINT "REL_b76b435f583d4e68c892a7fafa" UNIQUE ("payloadFileId"),
                CONSTRAINT "fk_trigger_run_trigger_source_id" FOREIGN KEY ("triggerSourceId") REFERENCES "trigger_source" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)

        await queryRunner.query(`
            DROP TABLE "trigger_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_trigger_run"
                RENAME TO "trigger_run"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_run_job_id" ON "trigger_run" ("jobId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_created_piece_name_platform_id" ON "trigger_run" ("created", "platformId", "pieceName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_trigger_source_id" ON "trigger_run" ("triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_payload_file_id" ON "trigger_run" ("payloadFileId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_job_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_created_piece_name_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_trigger_source_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_payload_file_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_trigger_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "payloadFileId" varchar,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "error" varchar,
                "status" varchar NOT NULL,
                "triggerSourceId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "jobId" varchar NOT NULL,
                CONSTRAINT "REL_b76b435f583d4e68c892a7fafa" UNIQUE ("payloadFileId"),
                CONSTRAINT "fk_trigger_run_trigger_source_id" FOREIGN KEY ("triggerSourceId") REFERENCES "trigger_source" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_payload_file_id" FOREIGN KEY ("payloadFileId") REFERENCES "file" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)

        await queryRunner.query(`
            DROP TABLE "trigger_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_trigger_run"
                RENAME TO "trigger_run"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_run_job_id" ON "trigger_run" ("jobId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_created_piece_name_platform_id" ON "trigger_run" ("created", "platformId", "pieceName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_trigger_source_id" ON "trigger_run" ("triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_payload_file_id" ON "trigger_run" ("payloadFileId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_payload_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_trigger_source_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_created_piece_name_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_job_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
                RENAME TO "temporary_trigger_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "trigger_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "payloadFileId" varchar,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "error" varchar,
                "status" varchar NOT NULL,
                "triggerSourceId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "jobId" varchar NOT NULL,
                CONSTRAINT "REL_b76b435f583d4e68c892a7fafa" UNIQUE ("payloadFileId"),
                CONSTRAINT "fk_trigger_run_trigger_source_id" FOREIGN KEY ("triggerSourceId") REFERENCES "trigger_source" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "trigger_run"(
                    "id",
                    "created",
                    "updated",
                    "payloadFileId",
                    "pieceName",
                    "pieceVersion",
                    "error",
                    "status",
                    "triggerSourceId",
                    "projectId",
                    "platformId",
                    "jobId"
                )
            SELECT "id",
                "created",
                "updated",
                "payloadFileId",
                "pieceName",
                "pieceVersion",
                "error",
                "status",
                "triggerSourceId",
                "projectId",
                "platformId",
                "jobId"
            FROM "temporary_trigger_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_trigger_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_payload_file_id" ON "trigger_run" ("payloadFileId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_trigger_source_id" ON "trigger_run" ("triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_created_piece_name_platform_id" ON "trigger_run" ("created", "platformId", "pieceName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_run_job_id" ON "trigger_run" ("jobId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_payload_file_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_trigger_source_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_created_piece_name_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_job_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
                RENAME TO "temporary_trigger_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "trigger_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "payloadFileId" varchar,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "error" varchar,
                "status" varchar NOT NULL,
                "triggerSourceId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "flowId" varchar(21),
                "jobId" varchar NOT NULL,
                CONSTRAINT "REL_b76b435f583d4e68c892a7fafa" UNIQUE ("payloadFileId"),
                CONSTRAINT "fk_trigger_run_trigger_source_id" FOREIGN KEY ("triggerSourceId") REFERENCES "trigger_source" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "trigger_run"(
                    "id",
                    "created",
                    "updated",
                    "payloadFileId",
                    "pieceName",
                    "pieceVersion",
                    "error",
                    "status",
                    "triggerSourceId",
                    "projectId",
                    "platformId",
                    "jobId"
                )
            SELECT "id",
                "created",
                "updated",
                "payloadFileId",
                "pieceName",
                "pieceVersion",
                "error",
                "status",
                "triggerSourceId",
                "projectId",
                "platformId",
                "jobId"
            FROM "temporary_trigger_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_trigger_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_created_piece_name_platform_id" ON "trigger_run" ("created", "platformId", "pieceName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_run_job_id" ON "trigger_run" ("jobId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_created_piece_name_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_job_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
                RENAME TO "temporary_trigger_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "trigger_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "payloadFileId" varchar,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "error" varchar,
                "status" varchar NOT NULL,
                "triggerSourceId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "flowId" varchar(21),
                "jobId" varchar NOT NULL,
                CONSTRAINT "REL_b76b435f583d4e68c892a7fafa" UNIQUE ("payloadFileId"),
                CONSTRAINT "fk_trigger_run_trigger_source_id" FOREIGN KEY ("triggerSourceId") REFERENCES "trigger_source" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_payload_file_id" FOREIGN KEY ("payloadFileId") REFERENCES "file" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_trigger_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                    CONSTRAINT "fk_trigger_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "trigger_run"(
                    "id",
                    "created",
                    "updated",
                    "payloadFileId",
                    "pieceName",
                    "pieceVersion",
                    "error",
                    "status",
                    "triggerSourceId",
                    "projectId",
                    "platformId",
                    "flowId",
                    "jobId"
                )
            SELECT "id",
                "created",
                "updated",
                "payloadFileId",
                "pieceName",
                "pieceVersion",
                "error",
                "status",
                "triggerSourceId",
                "projectId",
                "platformId",
                "flowId",
                "jobId"
            FROM "temporary_trigger_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_trigger_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_created_piece_name_platform_id" ON "trigger_run" ("created", "platformId", "pieceName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_run_job_id" ON "trigger_run" ("jobId")
        `)
    }

}
