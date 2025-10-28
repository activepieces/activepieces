import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpRunEntitySQLITE1748365786218 implements MigrationInterface {
    name = 'AddMcpRunEntitySQLITE1748365786218'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
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
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
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
            DROP TABLE "mcp_run"
        `)
    }

}
