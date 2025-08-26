import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExternalidToMCPToolSQLite1754220095236 implements MigrationInterface {
    name = 'AddExternalidToMCPToolSQLite1754220095236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
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
                CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_ff5eb8d6e2b6375d0d98569d5fb" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                "id"
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
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_mcp_id"
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
                CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
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
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "mcpId",
                "type",
                "pieceMetadata",
                "flowId"
            FROM "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_tool"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
    }

}
