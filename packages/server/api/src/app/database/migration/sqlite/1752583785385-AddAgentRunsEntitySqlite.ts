import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentRunsEntitySqlite1752583785385 implements MigrationInterface {
    name = 'AddAgentRunsEntitySqlite1752583785385'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                "prompt" varchar NOT NULL
            )
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
                CONSTRAINT "FK_fd5968f224bbef0787a26563dd5" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_a2642efaec1c09ebf098411314f" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                "prompt" varchar NOT NULL
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
            DROP TABLE "agent_run"
        `)
    }

}
