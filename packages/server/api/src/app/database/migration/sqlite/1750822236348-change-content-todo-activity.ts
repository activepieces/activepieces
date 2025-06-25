import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeContentTodoActivity1750822236348 implements MigrationInterface {
    name = 'ChangeContentTodoActivity1750822236348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_todo_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_todo_activity" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "todoId" varchar(21) NOT NULL,
                "userId" varchar(21),
                "agentId" varchar(21),
                "content" text NOT NULL,
                CONSTRAINT "FK_a70ac10a601ca72584dff95e0d0" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_activity_user_id" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_activity_todo_id" FOREIGN KEY ("todoId") REFERENCES "todo" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_todo_activity"(
                    "id",
                    "created",
                    "updated",
                    "todoId",
                    "userId",
                    "agentId",
                    "content"
                )
            SELECT "id",
                "created",
                "updated",
                "todoId",
                "userId",
                "agentId",
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
            CREATE INDEX "idx_todo_activity_agent_id" ON "todo_activity" ("agentId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_user_id" ON "todo_activity" ("userId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_todo_id" ON "todo_activity" ("todoId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_todo_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_agent_id"
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
                "agentId" varchar(21),
                "content" varchar NOT NULL,
                CONSTRAINT "FK_a70ac10a601ca72584dff95e0d0" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_activity_user_id" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_activity_todo_id" FOREIGN KEY ("todoId") REFERENCES "todo" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "todo_activity"(
                    "id",
                    "created",
                    "updated",
                    "todoId",
                    "userId",
                    "agentId",
                    "content"
                )
            SELECT "id",
                "created",
                "updated",
                "todoId",
                "userId",
                "agentId",
                "content"
            FROM "temporary_todo_activity"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_todo_activity"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_todo_id" ON "todo_activity" ("todoId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_user_id" ON "todo_activity" ("userId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_agent_id" ON "todo_activity" ("agentId")
        `)
    }
}
