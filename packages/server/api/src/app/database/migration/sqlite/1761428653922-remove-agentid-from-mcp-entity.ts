import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveAgentidFromMcpEntity1761428653922 implements MigrationInterface {
    name = 'RemoveAgentidFromMcpEntity1760452015042'
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_mcp_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "toolId" varchar(21),
                "metadata" text NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "status" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_run"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "projectId",
                    "toolId",
                    "metadata",
                    "input",
                    "output",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "projectId",
                "toolId",
                "metadata",
                "input",
                "output",
                "status"
            FROM "mcp_run"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_run"
                RENAME TO "mcp_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_tool" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "type" varchar CHECK("type" IN ('PIECE', 'FLOW')) NOT NULL,
                "pieceMetadata" text,
                "flowId" varchar,
                "externalId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_tool"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "type",
                    "pieceMetadata",
                    "flowId",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "type",
                "pieceMetadata",
                "flowId",
                "externalId"
            FROM "mcp_tool"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_tool"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_tool"
                RENAME TO "mcp_tool"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id_external_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                "externalId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "projectId",
                    "token",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "token",
                "externalId"
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
            CREATE UNIQUE INDEX "mcp_project_id_external_id" ON "mcp" ("projectId", "externalId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_tool" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "type" varchar CHECK("type" IN ('PIECE', 'FLOW')) NOT NULL,
                "pieceMetadata" text,
                "flowId" varchar,
                "externalId" varchar(21) NOT NULL,
                CONSTRAINT "FK_ff5eb8d6e2b6375d0d98569d5fb" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_tool"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "type",
                    "pieceMetadata",
                    "flowId",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "type",
                "pieceMetadata",
                "flowId",
                "externalId"
            FROM "mcp_tool"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_tool"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_tool"
                RENAME TO "mcp_tool"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_mcp_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "toolId" varchar(21),
                "metadata" text NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "status" varchar NOT NULL,
                CONSTRAINT "fk_mcp_run_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_mcp_run_tool_id" FOREIGN KEY ("toolId") REFERENCES "mcp_tool" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_mcp_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_run"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "projectId",
                    "toolId",
                    "metadata",
                    "input",
                    "output",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "projectId",
                "toolId",
                "metadata",
                "input",
                "output",
                "status"
            FROM "mcp_run"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_run"
                RENAME TO "mcp_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_run"
                RENAME TO "temporary_mcp_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "toolId" varchar(21),
                "metadata" text NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "status" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_run"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "projectId",
                    "toolId",
                    "metadata",
                    "input",
                    "output",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "projectId",
                "toolId",
                "metadata",
                "input",
                "output",
                "status"
            FROM "temporary_mcp_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
                RENAME TO "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_tool" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "type" varchar CHECK("type" IN ('PIECE', 'FLOW')) NOT NULL,
                "pieceMetadata" text,
                "flowId" varchar,
                "externalId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_tool"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "type",
                    "pieceMetadata",
                    "flowId",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "type",
                "pieceMetadata",
                "flowId",
                "externalId"
            FROM "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
                RENAME TO "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar NOT NULL,
                "token" varchar NOT NULL,
                "externalId" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "projectId",
                    "token",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "token",
                "externalId"
            FROM "temporary_mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id_external_id" ON "mcp" ("projectId", "externalId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
                RENAME TO "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_tool" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "type" varchar CHECK("type" IN ('PIECE', 'FLOW')) NOT NULL,
                "pieceMetadata" text,
                "flowId" varchar,
                "externalId" varchar(21) NOT NULL,
                CONSTRAINT "FK_ff5eb8d6e2b6375d0d98569d5fb" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_tool"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "type",
                    "pieceMetadata",
                    "flowId",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "type",
                "pieceMetadata",
                "flowId",
                "externalId"
            FROM "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_run"
                RENAME TO "temporary_mcp_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "toolId" varchar(21),
                "metadata" text NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "status" varchar NOT NULL,
                CONSTRAINT "fk_mcp_run_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_run"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "projectId",
                    "toolId",
                    "metadata",
                    "input",
                    "output",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "projectId",
                "toolId",
                "metadata",
                "input",
                "output",
                "status"
            FROM "temporary_mcp_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
        `)
    }
}
