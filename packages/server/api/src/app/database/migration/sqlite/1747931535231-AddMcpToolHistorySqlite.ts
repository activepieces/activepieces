import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMcpToolHistorySqlite1747931535231 implements MigrationInterface {
    name = 'AddMcpToolHistorySqlite1747931535231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp_piece_tool_history" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "toolName" varchar NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "success" boolean NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_tool_history_mcp_id" ON "mcp_piece_tool_history" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_flow_tool_history" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                "toolName" varchar NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "success" boolean NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_tool_history_mcp_id" ON "mcp_flow_tool_history" ("mcpId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_tool_history_mcp_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_piece_tool_history" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "toolName" varchar NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "success" boolean NOT NULL,
                CONSTRAINT "fk_mcp_piece_tool_history_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_piece_tool_history"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "pieceName",
                    "pieceVersion",
                    "toolName",
                    "input",
                    "output",
                    "success"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "pieceName",
                "pieceVersion",
                "toolName",
                "input",
                "output",
                "success"
            FROM "mcp_piece_tool_history"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_piece_tool_history"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_piece_tool_history"
                RENAME TO "mcp_piece_tool_history"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_tool_history_mcp_id" ON "mcp_piece_tool_history" ("mcpId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_tool_history_mcp_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_flow_tool_history" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                "toolName" varchar NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "success" boolean NOT NULL,
                CONSTRAINT "fk_mcp_flow_tool_history_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_flow_tool_history"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "flowId",
                    "flowVersionId",
                    "toolName",
                    "input",
                    "output",
                    "success"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "flowId",
                "flowVersionId",
                "toolName",
                "input",
                "output",
                "success"
            FROM "mcp_flow_tool_history"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_flow_tool_history"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_flow_tool_history"
                RENAME TO "mcp_flow_tool_history"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_tool_history_mcp_id" ON "mcp_flow_tool_history" ("mcpId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_tool_history_mcp_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_flow_tool_history"
                RENAME TO "temporary_mcp_flow_tool_history"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_flow_tool_history" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                "toolName" varchar NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "success" boolean NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "mcp_flow_tool_history"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "flowId",
                    "flowVersionId",
                    "toolName",
                    "input",
                    "output",
                    "success"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "flowId",
                "flowVersionId",
                "toolName",
                "input",
                "output",
                "success"
            FROM "temporary_mcp_flow_tool_history"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_flow_tool_history"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_tool_history_mcp_id" ON "mcp_flow_tool_history" ("mcpId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_tool_history_mcp_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece_tool_history"
                RENAME TO "temporary_mcp_piece_tool_history"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_piece_tool_history" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "toolName" varchar NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "success" boolean NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "mcp_piece_tool_history"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
                    "pieceName",
                    "pieceVersion",
                    "toolName",
                    "input",
                    "output",
                    "success"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "pieceName",
                "pieceVersion",
                "toolName",
                "input",
                "output",
                "success"
            FROM "temporary_mcp_piece_tool_history"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_piece_tool_history"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_tool_history_mcp_id" ON "mcp_piece_tool_history" ("mcpId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_tool_history_mcp_id"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_flow_tool_history"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_tool_history_mcp_id"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_piece_tool_history"
        `);
    }

}
