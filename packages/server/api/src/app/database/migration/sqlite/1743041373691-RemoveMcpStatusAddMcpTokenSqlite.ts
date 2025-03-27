import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveMcpStatusAddMcpTokenSqlite1743041373691 implements MigrationInterface {
    name = 'RemoveMcpStatusAddMcpTokenSqlite1743041373691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // SQLite doesn't support dropping columns directly, so we need to recreate tables
        
        // Save mcp_connection data first
        const mcpConnectionData = await queryRunner.query(`SELECT * FROM "mcp_connection"`)
        
        // Create a temporary table with the new structure
        await queryRunner.query(`
            CREATE TABLE "mcp_new" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar(21) NOT NULL DEFAULT '',
                CONSTRAINT "mcp_project_id" UNIQUE ("projectId"),
                FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE
            )
        `)

        // Copy data from old table to new table (except status which is being removed)
        await queryRunner.query(`
            INSERT INTO "mcp_new" ("id", "created", "updated", "projectId", "token")
            SELECT "id", "created", "updated", "projectId", '' as "token"
            FROM "mcp"
        `)

        // Drop old tables
        await queryRunner.query(`DROP TABLE "mcp_connection"`)
        await queryRunner.query(`DROP TABLE "mcp"`)

        // Rename new table to original name
        await queryRunner.query(`ALTER TABLE "mcp_new" RENAME TO "mcp"`)

        // Recreate indexes
        await queryRunner.query(`CREATE INDEX "idx_mcp_project_id" ON "mcp" ("projectId")`)

        // Recreate join table with updated foreign keys
        await queryRunner.query(`
            CREATE TABLE "mcp_connection" (
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21) NOT NULL,
                PRIMARY KEY ("mcpId", "connectionId"),
                FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE,
                FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE CASCADE
            )
        `)
        
        // Recreate indices on join table
        await queryRunner.query(`CREATE INDEX "idx_mcp_connection_mcp_id" ON "mcp_connection" ("mcpId")`)
        await queryRunner.query(`CREATE INDEX "idx_mcp_connection_connection_id" ON "mcp_connection" ("connectionId")`)
        
        // Restore mcp_connection data
        if (mcpConnectionData && mcpConnectionData.length > 0) {
            for (const row of mcpConnectionData) {
                await queryRunner.query(`
                    INSERT INTO "mcp_connection" ("mcpId", "connectionId") 
                    VALUES ('${row.mcpId}', '${row.connectionId}')
                `)
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Down migration for SQLite - recreate the table with status column and without token
        
        // Save mcp_connection data first
        const mcpConnectionData = await queryRunner.query(`SELECT * FROM "mcp_connection"`)
        
        // Create a temporary table with the old structure
        await queryRunner.query(`
            CREATE TABLE "mcp_new" (
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

        // Copy data from current table to old structure (setting default status value)
        await queryRunner.query(`
            INSERT INTO "mcp_new" ("id", "created", "updated", "projectId", "status")
            SELECT "id", "created", "updated", "projectId", 'DISABLED' as "status"
            FROM "mcp"
        `)

        // Drop current tables
        await queryRunner.query(`DROP INDEX "idx_mcp_connection_connection_id"`)
        await queryRunner.query(`DROP INDEX "idx_mcp_connection_mcp_id"`)
        await queryRunner.query(`DROP TABLE "mcp_connection"`)
        await queryRunner.query(`DROP INDEX "idx_mcp_project_id"`)
        await queryRunner.query(`DROP TABLE "mcp"`)

        // Rename new table to original name
        await queryRunner.query(`ALTER TABLE "mcp_new" RENAME TO "mcp"`)

        // Recreate indexes
        await queryRunner.query(`CREATE INDEX "idx_mcp_project_id" ON "mcp" ("projectId")`)

        // Recreate join table with original foreign keys
        await queryRunner.query(`
            CREATE TABLE "mcp_connection" (
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21) NOT NULL,
                PRIMARY KEY ("mcpId", "connectionId"),
                FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE,
                FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE CASCADE
            )
        `)

        // Recreate original indices
        await queryRunner.query(`CREATE INDEX "idx_mcp_connection_mcp_id" ON "mcp_connection" ("mcpId")`)
        await queryRunner.query(`CREATE INDEX "idx_mcp_connection_connection_id" ON "mcp_connection" ("connectionId")`)
        
        // Restore mcp_connection data
        if (mcpConnectionData && mcpConnectionData.length > 0) {
            for (const row of mcpConnectionData) {
                await queryRunner.query(`
                    INSERT INTO "mcp_connection" ("mcpId", "connectionId") 
                    VALUES ('${row.mcpId}', '${row.connectionId}')
                `)
            }
        }
    }
} 