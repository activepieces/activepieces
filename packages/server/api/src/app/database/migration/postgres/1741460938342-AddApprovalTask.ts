import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApprovalTask1741460938342 implements MigrationInterface {
    name = 'AddApprovalTask1741460938342'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "approval_task" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "assignedUserId" varchar(21) NOT NULL,
                "options" text NOT NULL,
                "selectedOption" varchar NOT NULL,
                "title" varchar NOT NULL,
                "description" varchar NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_project_id" ON "approval_task" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_flow_id" ON "approval_task" ("flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_assigned_user_id" ON "approval_task" ("assignedUserId")
        `);
        await queryRunner.query(`
            CREATE TABLE "approval_task_comment" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "taskId" varchar(21) NOT NULL,
                "userId" varchar(21) NOT NULL,
                "comment" varchar NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_comment_task_id" ON "approval_task_comment" ("taskId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_comment_user_id" ON "approval_task_comment" ("userId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_project_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_assigned_user_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_approval_task" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "assignedUserId" varchar(21) NOT NULL,
                "options" text NOT NULL,
                "selectedOption" varchar NOT NULL,
                "title" varchar NOT NULL,
                "description" varchar NOT NULL,
                CONSTRAINT "FK_0874c68f678b6c9500bf5d61803" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_b4e1191cceb1f1731b61288d21f" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_61f1fa2281bf7f457d2968bdf13" FOREIGN KEY ("assignedUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_approval_task"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "assignedUserId",
                    "options",
                    "selectedOption",
                    "title",
                    "description"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "assignedUserId",
                "options",
                "selectedOption",
                "title",
                "description"
            FROM "approval_task"
        `);
        await queryRunner.query(`
            DROP TABLE "approval_task"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_approval_task"
                RENAME TO "approval_task"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_project_id" ON "approval_task" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_flow_id" ON "approval_task" ("flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_assigned_user_id" ON "approval_task" ("assignedUserId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_comment_task_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_comment_user_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_approval_task_comment" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "taskId" varchar(21) NOT NULL,
                "userId" varchar(21) NOT NULL,
                "comment" varchar NOT NULL,
                CONSTRAINT "FK_11efcd682a749470f3de6705a54" FOREIGN KEY ("taskId") REFERENCES "approval_task" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_approval_task_comment"(
                    "id",
                    "created",
                    "updated",
                    "taskId",
                    "userId",
                    "comment"
                )
            SELECT "id",
                "created",
                "updated",
                "taskId",
                "userId",
                "comment"
            FROM "approval_task_comment"
        `);
        await queryRunner.query(`
            DROP TABLE "approval_task_comment"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_approval_task_comment"
                RENAME TO "approval_task_comment"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_comment_task_id" ON "approval_task_comment" ("taskId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_comment_user_id" ON "approval_task_comment" ("userId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_comment_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_comment_task_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "approval_task_comment"
                RENAME TO "temporary_approval_task_comment"
        `);
        await queryRunner.query(`
            CREATE TABLE "approval_task_comment" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "taskId" varchar(21) NOT NULL,
                "userId" varchar(21) NOT NULL,
                "comment" varchar NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "approval_task_comment"(
                    "id",
                    "created",
                    "updated",
                    "taskId",
                    "userId",
                    "comment"
                )
            SELECT "id",
                "created",
                "updated",
                "taskId",
                "userId",
                "comment"
            FROM "temporary_approval_task_comment"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_approval_task_comment"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_comment_user_id" ON "approval_task_comment" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_comment_task_id" ON "approval_task_comment" ("taskId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_assigned_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "approval_task"
                RENAME TO "temporary_approval_task"
        `);
        await queryRunner.query(`
            CREATE TABLE "approval_task" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "assignedUserId" varchar(21) NOT NULL,
                "options" text NOT NULL,
                "selectedOption" varchar NOT NULL,
                "title" varchar NOT NULL,
                "description" varchar NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "approval_task"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "assignedUserId",
                    "options",
                    "selectedOption",
                    "title",
                    "description"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "assignedUserId",
                "options",
                "selectedOption",
                "title",
                "description"
            FROM "temporary_approval_task"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_approval_task"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_assigned_user_id" ON "approval_task" ("assignedUserId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_flow_id" ON "approval_task" ("flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_approval_task_project_id" ON "approval_task" ("projectId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_comment_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_comment_task_id"
        `);
        await queryRunner.query(`
            DROP TABLE "approval_task_comment"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_assigned_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_approval_task_project_id"
        `);
        await queryRunner.query(`
            DROP TABLE "approval_task"
        `);
    }

}
