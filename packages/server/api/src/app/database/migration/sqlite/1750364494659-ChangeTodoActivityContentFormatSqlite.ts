import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeTodoActivityContentFormatSqlite1750364494659 implements MigrationInterface {
    name = 'ChangeTodoActivityContentFormatSqlite1750364494659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT,
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
            FROM "issue"
        `)
        await queryRunner.query(`
            DROP TABLE "issue"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_issue"
                RENAME TO "issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
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
            CREATE TABLE "temporary_todo" (
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
                CONSTRAINT "fk_todo_assignee_id" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_run_id" FOREIGN KEY ("runId") REFERENCES "flow_run" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_e536f48cd7c23bce4e3958de2d6" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_c79681af2867d6f762d94b885a9" FOREIGN KEY ("createdByUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_todo"(
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
            DELETE FROM "todo_activity"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_todo_activity" (
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
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
            FROM "issue"
        `)
        await queryRunner.query(`
            DROP TABLE "issue"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_issue"
                RENAME TO "issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
            FROM "issue"
        `)
        await queryRunner.query(`
            DROP TABLE "issue"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_issue"
                RENAME TO "issue"
        `)
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
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
            FROM "issue"
        `)
        await queryRunner.query(`
            DROP TABLE "issue"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_issue"
                RENAME TO "issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
                RENAME TO "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE TABLE "issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
            FROM "temporary_issue"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
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
        await queryRunner.query(`
            ALTER TABLE "issue"
                RENAME TO "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE TABLE "issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
            FROM "temporary_issue"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
                RENAME TO "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE TABLE "issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
            FROM "temporary_issue"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
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
                "flowId" varchar(21),
                "runId" varchar(21),
                "resolveUrl" varchar,
                "environment" varchar NOT NULL,
                "agentId" varchar(21),
                "createdByUserId" varchar(21),
                "locked" boolean NOT NULL DEFAULT (0),
                CONSTRAINT "fk_todo_assignee_id" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_run_id" FOREIGN KEY ("runId") REFERENCES "flow_run" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_e536f48cd7c23bce4e3958de2d6" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_c79681af2867d6f762d94b885a9" FOREIGN KEY ("createdByUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            FROM "temporary_todo"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_todo"
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
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
                RENAME TO "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE TABLE "issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT,
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
            FROM "temporary_issue"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
    }

}
