import { MigrationInterface, QueryRunner } from 'typeorm'

export class RevertDescriptionTodoNamingSqlite1750391313307 implements MigrationInterface {
    name = 'RevertDescriptionTodoNamingSqlite1750391313307'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
            DROP INDEX "idx_todo_agent_id"
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
                "flowId" varchar(21),
                "runId" varchar(21),
                "resolveUrl" varchar,
                "environment" varchar NOT NULL,
                "agentId" varchar(21),
                "createdByUserId" varchar(21),
                "locked" boolean NOT NULL DEFAULT (0),
                CONSTRAINT "fk_todo_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_c79681af2867d6f762d94b885a9" FOREIGN KEY ("createdByUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_e536f48cd7c23bce4e3958de2d6" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
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
                    "resolveUrl",
                    "environment",
                    "agentId",
                    "createdByUserId",
                    "locked"
                )
            SELECT "id",
                "created",
                "updated",
                "title",
                "content",
                "status",
                "statusOptions",
                "assigneeId",
                "platformId",
                "projectId",
                "flowId",
                "runId",
                "resolveUrl",
                "environment",
                "agentId",
                "createdByUserId",
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
            CREATE INDEX "idx_todo_agent_id" ON "todo" ("agentId")
        `)
        await queryRunner.query(`
            DROP TABLE IF EXISTS "issue"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_todo_agent_id"
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
                "content" varchar,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21),
                "runId" varchar(21),
                "resolveUrl" varchar,
                "environment" varchar NOT NULL,
                "agentId" varchar(21),
                "createdByUserId" varchar(21),
                "locked" boolean NOT NULL DEFAULT (0),
                CONSTRAINT "fk_todo_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_c79681af2867d6f762d94b885a9" FOREIGN KEY ("createdByUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_e536f48cd7c23bce4e3958de2d6" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_run_id" FOREIGN KEY ("runId") REFERENCES "flow_run" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_assignee_id" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "todo"(
                    "id",
                    "created",
                    "updated",
                    "title",
                    "content",
                    "status",
                    "statusOptions",
                    "assigneeId",
                    "platformId",
                    "projectId",
                    "flowId",
                    "runId",
                    "resolveUrl",
                    "environment",
                    "agentId",
                    "createdByUserId",
                    "locked"
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
                "resolveUrl",
                "environment",
                "agentId",
                "createdByUserId",
                "locked"
            FROM "temporary_todo"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_todo"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_agent_id" ON "todo" ("agentId")
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
    }

}
