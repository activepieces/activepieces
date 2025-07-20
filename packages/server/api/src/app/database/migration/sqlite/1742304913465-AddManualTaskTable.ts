import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddManualTaskTable1742304913465 implements MigrationInterface {
    name = 'AddManualTaskTable1742304913465'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "manual_task" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "title" varchar NOT NULL,
                "description" varchar,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "runId" varchar(21),
                "approvalUrl" varchar
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_project_id" ON "manual_task" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_flow_id" ON "manual_task" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_platform_id" ON "manual_task" ("platformId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_platform_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_manual_task" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "title" varchar NOT NULL,
                "description" varchar,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "runId" varchar(21),
                "approvalUrl" varchar,
                CONSTRAINT "fk_manual_task_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_manual_task_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_manual_task_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_manual_task_run_id" FOREIGN KEY ("runId") REFERENCES "flow_run" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_manual_task_assignee_id" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_manual_task"(
                    "id",
                    "created",
                    "updated",
                    "title",
                    "description",
                    "status",
                    "statusOptions",
                    "assigneeId",
                    "platformId",
                    "projectId",
                    "flowId",
                    "runId",
                    "approvalUrl"
                )
            SELECT "id",
                "created",
                "updated",
                "title",
                "description",
                "status",
                "statusOptions",
                "assigneeId",
                "platformId",
                "projectId",
                "flowId",
                "runId",
                "approvalUrl"
            FROM "manual_task"
        `)
        await queryRunner.query(`
            DROP TABLE "manual_task"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_manual_task"
                RENAME TO "manual_task"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_project_id" ON "manual_task" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_flow_id" ON "manual_task" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_platform_id" ON "manual_task" ("platformId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "manual_task"
                RENAME TO "temporary_manual_task"
        `)
        await queryRunner.query(`
            CREATE TABLE "manual_task" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "title" varchar NOT NULL,
                "description" varchar,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "runId" varchar(21),
                "approvalUrl" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "manual_task"(
                    "id",
                    "created",
                    "updated",
                    "title",
                    "description",
                    "status",
                    "statusOptions",
                    "assigneeId",
                    "platformId",
                    "projectId",
                    "flowId",
                    "runId",
                    "approvalUrl"
                )
            SELECT "id",
                "created",
                "updated",
                "title",
                "description",
                "status",
                "statusOptions",
                "assigneeId",
                "platformId",
                "projectId",
                "flowId",
                "runId",
                "approvalUrl"
            FROM "temporary_manual_task"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_manual_task"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_platform_id" ON "manual_task" ("platformId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_flow_id" ON "manual_task" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_manual_task_project_id" ON "manual_task" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_manual_task_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "manual_task"
        `)
    }

}
