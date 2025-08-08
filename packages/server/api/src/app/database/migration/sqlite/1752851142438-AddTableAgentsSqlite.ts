import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTableAgentsSqlite1752851142438 implements MigrationInterface {
    name = 'AddTableAgentsSqlite1752851142438'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                "agentId" varchar,
                "trigger" varchar NOT NULL,
                CONSTRAINT "UQ_64553403d0ac6bdb0876d4c72e2" UNIQUE ("agentId"),
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_table"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "projectId",
                    "externalId",
                    "trigger"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "externalId",
                "trigger"
            FROM "table"
        `)
        await queryRunner.query(`
            DROP TABLE "table"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_table"
                RENAME TO "table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_agent_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "output" text,
                "steps" text NOT NULL,
                "message" varchar,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "prompt" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "FK_a2642efaec1c09ebf098411314f" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_fd5968f224bbef0787a26563dd5" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_agent_run"(
                    "id",
                    "created",
                    "updated",
                    "agentId",
                    "projectId",
                    "status",
                    "output",
                    "steps",
                    "message",
                    "startTime",
                    "finishTime",
                    "prompt"
                )
            SELECT "id",
                "created",
                "updated",
                "agentId",
                "projectId",
                "status",
                "output",
                "steps",
                "message",
                "startTime",
                "finishTime",
                "prompt"
            FROM "agent_run"
        `)
        await queryRunner.query(`
            DROP TABLE "agent_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_agent_run"
                RENAME TO "agent_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_agent_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "output" text,
                "steps" text NOT NULL,
                "message" varchar,
                "startTime" datetime,
                "finishTime" datetime,
                "prompt" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "FK_a2642efaec1c09ebf098411314f" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_fd5968f224bbef0787a26563dd5" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_agent_run"(
                    "id",
                    "created",
                    "updated",
                    "agentId",
                    "projectId",
                    "status",
                    "output",
                    "steps",
                    "message",
                    "startTime",
                    "finishTime",
                    "prompt",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "agentId",
                "projectId",
                "status",
                "output",
                "steps",
                "message",
                "startTime",
                "finishTime",
                "prompt",
                "metadata"
            FROM "agent_run"
        `)
        await queryRunner.query(`
            DROP TABLE "agent_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_agent_run"
                RENAME TO "agent_run"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                "agentId" varchar,
                "trigger" varchar NOT NULL,
                CONSTRAINT "UQ_64553403d0ac6bdb0876d4c72e2" UNIQUE ("agentId"),
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_table"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "projectId",
                    "externalId",
                    "agentId",
                    "trigger"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "externalId",
                "agentId",
                "trigger"
            FROM "table"
        `)
        await queryRunner.query(`
            DROP TABLE "table"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_table"
                RENAME TO "table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
                RENAME TO "temporary_table"
        `)
        await queryRunner.query(`
            CREATE TABLE "table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                "agentId" varchar,
                "trigger" varchar NOT NULL,
                CONSTRAINT "UQ_64553403d0ac6bdb0876d4c72e2" UNIQUE ("agentId"),
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "table"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "projectId",
                    "externalId",
                    "agentId",
                    "trigger"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "externalId",
                "agentId",
                "trigger"
            FROM "temporary_table"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_run"
                RENAME TO "temporary_agent_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "agent_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "output" text,
                "steps" text NOT NULL,
                "message" varchar,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "prompt" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "FK_a2642efaec1c09ebf098411314f" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_fd5968f224bbef0787a26563dd5" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "agent_run"(
                    "id",
                    "created",
                    "updated",
                    "agentId",
                    "projectId",
                    "status",
                    "output",
                    "steps",
                    "message",
                    "startTime",
                    "finishTime",
                    "prompt",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "agentId",
                "projectId",
                "status",
                "output",
                "steps",
                "message",
                "startTime",
                "finishTime",
                "prompt",
                "metadata"
            FROM "temporary_agent_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_agent_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_run"
                RENAME TO "temporary_agent_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "agent_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "output" text,
                "steps" text NOT NULL,
                "message" varchar,
                "startTime" datetime NOT NULL,
                "finishTime" datetime,
                "prompt" varchar NOT NULL,
                CONSTRAINT "FK_a2642efaec1c09ebf098411314f" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_fd5968f224bbef0787a26563dd5" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "agent_run"(
                    "id",
                    "created",
                    "updated",
                    "agentId",
                    "projectId",
                    "status",
                    "output",
                    "steps",
                    "message",
                    "startTime",
                    "finishTime",
                    "prompt"
                )
            SELECT "id",
                "created",
                "updated",
                "agentId",
                "projectId",
                "status",
                "output",
                "steps",
                "message",
                "startTime",
                "finishTime",
                "prompt"
            FROM "temporary_agent_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_agent_run"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
                RENAME TO "temporary_table"
        `)
        await queryRunner.query(`
            CREATE TABLE "table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "table"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "projectId",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "externalId"
            FROM "temporary_table"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
    }

}
