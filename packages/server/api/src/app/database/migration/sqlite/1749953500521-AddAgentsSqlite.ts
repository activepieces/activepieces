import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentsSqlite1749953500521 implements MigrationInterface {
    name = 'AddAgentsSqlite1749953500521'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar(21) NOT NULL,
                "name" varchar NOT NULL DEFAULT ('MCP Server'),
                "agentId" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name"
            FROM "mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp"
                RENAME TO "mcp"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
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
                "mcpId" varchar NOT NULL,
                "outputType" varchar NOT NULL,
                "outputFields" text NOT NULL,
                CONSTRAINT "FK_bb2611fd1fdb5469f50c00eaf31" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_7103e2d16e62e3e3dc335307175" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_ai_provider"
                RENAME TO "ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_ai_provider"
                RENAME TO "ai_provider"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                "name" varchar NOT NULL,
                "agentId" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name",
                    "agentId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name",
                "agentId"
            FROM "mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp"
                RENAME TO "mcp"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL,
                CONSTRAINT "fk_ai_provider_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_ai_provider"
                RENAME TO "ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                "name" varchar NOT NULL,
                "agentId" varchar,
                CONSTRAINT "fk_mcp_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name",
                    "agentId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name",
                "agentId"
            FROM "mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp"
                RENAME TO "mcp"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
                RENAME TO "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                "name" varchar NOT NULL,
                "agentId" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name",
                    "agentId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name",
                "agentId"
            FROM "temporary_mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
                RENAME TO "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "temporary_ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
                RENAME TO "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar(21) NOT NULL,
                "name" varchar NOT NULL DEFAULT ('MCP Server'),
                "agentId" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name",
                    "agentId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name",
                "agentId"
            FROM "temporary_mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
                RENAME TO "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "temporary_ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
                RENAME TO "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL,
                CONSTRAINT "fk_ai_provider_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "temporary_ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
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
                "platformId" varchar NOT NULL,
                CONSTRAINT "FK_bb2611fd1fdb5469f50c00eaf31" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_7103e2d16e62e3e3dc335307175" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
                RENAME TO "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar(21) NOT NULL,
                "name" varchar NOT NULL DEFAULT ('MCP Server')
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name"
            FROM "temporary_mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
    }

}
