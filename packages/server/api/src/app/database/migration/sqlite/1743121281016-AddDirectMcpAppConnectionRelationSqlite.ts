import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDirectMcpAppConnectionRelationSqlite1743121281016 implements MigrationInterface {
    name = 'AddDirectMcpAppConnectionRelationSqlite1743121281016'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get existing connection data from join table
        const mcpConnectionData = await queryRunner.query(`SELECT * FROM "mcp_connection"`);
        
        // Step 1: Add mcpId column to app_connection
        await queryRunner.query(`
            ALTER TABLE "app_connection" ADD "mcpId" varchar(21)
        `);
        
        // Step 2: Create temporary app_connection table with foreign key constraint
        await queryRunner.query(`
            CREATE TABLE "app_connection_new" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar,
                "externalId" varchar,
                "type" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT ('ACTIVE'),
                "platformId" varchar NOT NULL,
                "pieceName" varchar,
                "ownerId" varchar,
                "mcpId" varchar(21),
                "projectIds" text NOT NULL,
                "scope" varchar,
                "value" text NOT NULL,
                FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
                FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        
        // Step 3: Copy all data from app_connection to the new table
        await queryRunner.query(`
            INSERT INTO "app_connection_new" (
                "id", "created", "updated", "displayName", "externalId", 
                "type", "status", "platformId", "pieceName", "ownerId", 
                "projectIds", "scope", "value", "mcpId"
            )
            SELECT 
                "id", "created", "updated", "displayName", "externalId",
                "type", "status", "platformId", "pieceName", "ownerId",
                "projectIds", "scope", "value", "mcpId"
            FROM "app_connection"
        `);
        
        // Step 4: Update the mcpId in the new table using join table data
        if (mcpConnectionData && mcpConnectionData.length > 0) {
            for (const row of mcpConnectionData) {
                await queryRunner.query(`
                    UPDATE "app_connection_new" 
                    SET "mcpId" = '${row.mcpId}' 
                    WHERE "id" = '${row.connectionId}'
                `);
            }
        }
        
        // Step 5: Drop the old table and rename the new one
        await queryRunner.query(`DROP TABLE "app_connection"`);
        await queryRunner.query(`ALTER TABLE "app_connection_new" RENAME TO "app_connection"`);
        
        // Step 6: Recreate indices
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_project_ids_and_external_id" ON "app_connection" ("projectIds", "externalId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id" ON "app_connection" ("platformId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_mcp_id" ON "app_connection" ("mcpId")
        `);
        
        // Step 7: Drop the join table since we're using direct relationship now
        await queryRunner.query(`DROP TABLE IF EXISTS "mcp_connection"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Get existing connection data to preserve relationships
        const connectionData = await queryRunner.query(`
            SELECT "id", "mcpId" FROM "app_connection" WHERE "mcpId" IS NOT NULL
        `);
        
        // Step 1: Create join table
        await queryRunner.query(`
            CREATE TABLE "mcp_connection" (
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21) NOT NULL,
                PRIMARY KEY ("mcpId", "connectionId"),
                FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        
        // Step 2: Create indices on join table
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_connection_mcp_id" ON "mcp_connection" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_connection_connection_id" ON "mcp_connection" ("connectionId")
        `);
        
        // Step 3: Populate join table with existing relationships
        if (connectionData && connectionData.length > 0) {
            for (const row of connectionData) {
                await queryRunner.query(`
                    INSERT INTO "mcp_connection" ("mcpId", "connectionId")
                    VALUES ('${row.mcpId}', '${row.id}')
                `);
            }
        }
        
        // Step 4: Create a new app_connection table without mcpId and foreign key
        await queryRunner.query(`
            CREATE TABLE "app_connection_new" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "displayName" varchar,
                "externalId" varchar,
                "type" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT ('ACTIVE'),
                "platformId" varchar NOT NULL,
                "pieceName" varchar,
                "ownerId" varchar,
                "projectIds" text NOT NULL,
                "scope" varchar,
                "value" text NOT NULL,
                FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);
        
        // Step 5: Copy data excluding mcpId
        await queryRunner.query(`
            INSERT INTO "app_connection_new" (
                "id", "created", "updated", "displayName", "externalId", 
                "type", "status", "platformId", "pieceName", "ownerId", 
                "projectIds", "scope", "value"
            )
            SELECT 
                "id", "created", "updated", "displayName", "externalId",
                "type", "status", "platformId", "pieceName", "ownerId",
                "projectIds", "scope", "value"
            FROM "app_connection"
        `);
        
        // Step 6: Drop old table and rename new one
        await queryRunner.query(`DROP TABLE "app_connection"`);
        await queryRunner.query(`ALTER TABLE "app_connection_new" RENAME TO "app_connection"`);
        
        // Step 7: Recreate original indices
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_project_ids_and_external_id" ON "app_connection" ("projectIds", "externalId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id" ON "app_connection" ("platformId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `);
    }
} 