import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpToolHistorySQLITE1748296086205 implements MigrationInterface {
    name = 'AddMcpToolHistorySQLITE1748296086205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp_tool_history" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "toolId" varchar(21) NOT NULL,
                "metadata" text NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "status" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_history_mcp_id" ON "mcp_tool_history" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_history_tool_id" ON "mcp_tool_history" ("toolId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_history_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_history_tool_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_tool_history" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "toolId" varchar(21) NOT NULL,
                "metadata" text NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "status" varchar NOT NULL,
                CONSTRAINT "fk_mcp_tool_history_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_mcp_tool_history_tool_id" FOREIGN KEY ("toolId") REFERENCES "mcp_tool" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_tool_history"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
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
                "toolId",
                "metadata",
                "input",
                "output",
                "status"
            FROM "mcp_tool_history"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_tool_history"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_tool_history"
                RENAME TO "mcp_tool_history"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_history_mcp_id" ON "mcp_tool_history" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_history_tool_id" ON "mcp_tool_history" ("toolId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_history_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_history_mcp_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool_history"
                RENAME TO "temporary_mcp_tool_history"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_tool_history" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "mcpId" varchar(21) NOT NULL,
                "toolId" varchar(21) NOT NULL,
                "metadata" text NOT NULL,
                "input" text NOT NULL,
                "output" text NOT NULL,
                "status" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_tool_history"(
                    "id",
                    "created",
                    "updated",
                    "mcpId",
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
                "toolId",
                "metadata",
                "input",
                "output",
                "status"
            FROM "temporary_mcp_tool_history"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_tool_history"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_history_tool_id" ON "mcp_tool_history" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_history_mcp_id" ON "mcp_tool_history" ("mcpId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_history_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_tool_history_mcp_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_tool_history"
        `)
    }

}
