import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMCPWithConnectionsSqlite1742867572875 implements MigrationInterface {
    name = 'AddMCPWithConnectionsSqlite1742867572875'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL DEFAULT 'DISABLED'
                    CONSTRAINT "mcp_status_check" CHECK("status" IN ('ENABLED', 'DISABLED')),
                CONSTRAINT "mcp_project_id" UNIQUE ("projectId"),
                FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query('CREATE INDEX "idx_mcp_project_id" ON "mcp" ("projectId")')

        await queryRunner.query(`
            CREATE TABLE "mcp_connection" (
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21) NOT NULL,
                PRIMARY KEY ("mcpId", "connectionId"),
                FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE,
                FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query('CREATE INDEX "idx_mcp_connection_mcp_id" ON "mcp_connection" ("mcpId")')
        await queryRunner.query('CREATE INDEX "idx_mcp_connection_connection_id" ON "mcp_connection" ("connectionId")')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_mcp_connection_connection_id"')
        await queryRunner.query('DROP INDEX "idx_mcp_connection_mcp_id"')
        await queryRunner.query('DROP TABLE "mcp_connection"')
        await queryRunner.query('DROP INDEX "idx_mcp_project_id"')
        await queryRunner.query('DROP TABLE "mcp"')
    }
} 