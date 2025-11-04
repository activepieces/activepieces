import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentsSqlite1748573768714 implements MigrationInterface {
    name = 'AddAgentsSqlite1748573768714'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "agent" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "profilePictureUrl" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "description" varchar NOT NULL,
                "maxSteps" integer NOT NULL,
                "testPrompt" varchar NOT NULL,
                "systemPrompt" varchar NOT NULL,
                "projectId" varchar NOT NULL,
                "platformId" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "todo_activity" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "todoId" varchar(21) NOT NULL,
                "userId" varchar(21),
                "agentId" varchar(21),
                "content" varchar NOT NULL
            )
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
                "resolveUrl" varchar,
                "environment" varchar NOT NULL,
                "agentId" varchar(21),
                "createdByUserId" varchar(21),
                "locked" boolean NOT NULL DEFAULT (0),
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
                    "resolveUrl",
                    "environment"
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
                'PRODUCTION'
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
                "resolveUrl" varchar,
                "environment" varchar NOT NULL,
                "agentId" varchar(21),
                "createdByUserId" varchar(21),
                "locked" boolean NOT NULL DEFAULT (0)
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
                "flowId" varchar(21),
                "runId" varchar(21),
                "resolveUrl" varchar,
                "environment" varchar NOT NULL,
                "agentId" varchar(21),
                "createdByUserId" varchar(21),
                "locked" boolean NOT NULL DEFAULT (0)
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
            CREATE TABLE "temporary_agent" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "profilePictureUrl" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "description" varchar NOT NULL,
                "maxSteps" integer NOT NULL,
                "testPrompt" varchar NOT NULL,
                "systemPrompt" varchar NOT NULL,
                "projectId" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                CONSTRAINT "FK_7103e2d16e62e3e3dc335307175" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_bb2611fd1fdb5469f50c00eaf31" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_agent"(
                    "id",
                    "created",
                    "updated",
                    "profilePictureUrl",
                    "displayName",
                    "description",
                    "maxSteps",
                    "testPrompt",
                    "systemPrompt",
                    "projectId",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "profilePictureUrl",
                "displayName",
                "description",
                "maxSteps",
                "testPrompt",
                "systemPrompt",
                "projectId",
                "platformId"
            FROM "agent"
        `)
        await queryRunner.query(`
            DROP TABLE "agent"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_agent"
                RENAME TO "agent"
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
            CREATE TABLE "temporary_todo_activity" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "todoId" varchar(21) NOT NULL,
                "userId" varchar(21),
                "agentId" varchar(21),
                "content" varchar NOT NULL,
                CONSTRAINT "fk_todo_activity_todo_id" FOREIGN KEY ("todoId") REFERENCES "todo" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_activity_user_id" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_a70ac10a601ca72584dff95e0d0" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            CREATE INDEX "idx_todo_activity_todo_id" ON "todo_activity" ("todoId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_user_id" ON "todo_activity" ("userId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_agent_id" ON "todo_activity" ("agentId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                "content" varchar NOT NULL
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
            CREATE INDEX "idx_todo_activity_agent_id" ON "todo_activity" ("agentId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_user_id" ON "todo_activity" ("userId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_todo_activity_todo_id" ON "todo_activity" ("todoId")
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
                RENAME TO "temporary_agent"
        `)
        await queryRunner.query(`
            CREATE TABLE "agent" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "profilePictureUrl" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "description" varchar NOT NULL,
                "maxSteps" integer NOT NULL,
                "testPrompt" varchar NOT NULL,
                "systemPrompt" varchar NOT NULL,
                "projectId" varchar NOT NULL,
                "platformId" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "agent"(
                    "id",
                    "created",
                    "updated",
                    "profilePictureUrl",
                    "displayName",
                    "description",
                    "maxSteps",
                    "testPrompt",
                    "systemPrompt",
                    "projectId",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "profilePictureUrl",
                "displayName",
                "description",
                "maxSteps",
                "testPrompt",
                "systemPrompt",
                "projectId",
                "platformId"
            FROM "temporary_agent"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_agent"
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
                "locked" boolean NOT NULL DEFAULT (0)
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
                "description" varchar,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "runId" varchar(21),
                "resolveUrl" varchar,
                "environment" varchar NOT NULL,
                "agentId" varchar(21),
                "createdByUserId" varchar(21),
                "locked" boolean NOT NULL DEFAULT (0)
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
                "resolveUrl" varchar,
                "environment" varchar NOT NULL,
                "agentId" varchar(21),
                "createdByUserId" varchar(21),
                "locked" boolean NOT NULL DEFAULT (0),
                CONSTRAINT "fk_todo_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                "resolveUrl" varchar,
                CONSTRAINT "fk_todo_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
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
                    "description",
                    "status",
                    "statusOptions",
                    "assigneeId",
                    "platformId",
                    "projectId",
                    "flowId",
                    "runId",
                    "resolveUrl"
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
                "resolveUrl"
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
            DROP INDEX "idx_todo_activity_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_todo_activity_todo_id"
        `)
        await queryRunner.query(`
            DROP TABLE "todo_activity"
        `)
        await queryRunner.query(`
            DROP TABLE "agent"
        `)
    }

}
