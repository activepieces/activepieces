import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeManualTasksToTodoSqlite1742432169253 implements MigrationInterface {
    name = 'ChangeManualTasksToTodoSqlite1742432169253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "todo" (
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
            CREATE INDEX "idx_todo_project_id" ON "todo" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_flow_id" ON "todo" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_platform_id" ON "todo" ("platformId")
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
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "runId" varchar(21),
                "approvalUrl" varchar,
                CONSTRAINT "fk_todo_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
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
        
        // Drop manual_tasks table
        await queryRunner.query(`
            DROP TABLE IF EXISTS "manual_task"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        
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
            INSERT INTO "todo"(
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
    }

}
