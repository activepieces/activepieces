import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpPieceSqlite1744822233873 implements MigrationInterface {
    name = 'AddMcpPieceSqlite1744822233873'

    public async up(queryRunner: QueryRunner): Promise<void> {


        // Drop the old index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_app_connection_mcp_id"
        `)

        // Create the new mcp_piece table with foreign key constraints directly
        await queryRunner.query(`
            CREATE TABLE "mcp_piece" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                "status" varchar DEFAULT 'ENABLED' NOT NULL,
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId"),
                CONSTRAINT "fk_mcp_piece_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_mcp_piece_connection_id" FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `)

        // Create indices for mcp_piece
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" ON "mcp_piece" ("mcpId", "pieceName")
        `)

        // Get all app connections with mcpId
        const connections = await queryRunner.query(`
              WITH RankedConnections AS (
                SELECT 
                    id,
                    "mcpId",
                    "pieceName",
                    ROW_NUMBER() OVER (PARTITION BY "mcpId", "pieceName" ORDER BY created DESC) as rn
                FROM "app_connection"
                WHERE "mcpId" IS NOT NULL
            )
            SELECT id, created, updated, pieceName, mcpId
            FROM "app_connection"
            WHERE "mcpId" IS NOT NULL AND id IN (
                SELECT id 
                FROM RankedConnections 
                WHERE rn = 1
            )
        `)
        
        // Insert mcp_piece entries for each connection
        for (const connection of connections) {
            const pieceId = apId()
            await queryRunner.query(`
                INSERT INTO "mcp_piece" (
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId",
                    "status"
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [pieceId, connection.created, connection.updated, connection.pieceName, connection.mcpId, connection.id, 'ENABLED'])
        }

        // Drop mcpId column from app_connection by recreating the table without it
        // Get existing fields and constraints info (simplified approach)
        await queryRunner.query(`
            CREATE TABLE "temporary_app_connection" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "value" text NOT NULL,
                "type" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT ('ACTIVE'),
                "ownerId" varchar,
                "displayName" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "projectIds" text NOT NULL,
                "scope" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "fk_app_connection_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `)

        // Copy data from the original table to the temporary table, excluding mcpId
        await queryRunner.query(`
            INSERT INTO "temporary_app_connection" (
                "id",
                "created",
                "updated",
                "pieceName",
                "value",
                "type",
                "status",
                "ownerId",
                "displayName",
                "externalId",
                "platformId",
                "projectIds",
                "scope",
                "metadata"
            )
            SELECT 
                "id",
                "created",
                "updated",
                "pieceName",
                "value",
                "type",
                "status",
                "ownerId",
                "displayName",
                "externalId",
                "platformId",
                "projectIds",
                "scope",
                "metadata"
            FROM "app_connection"
        `)

        // Drop the original table
        await queryRunner.query(`
            DROP TABLE "app_connection"
        `)

        // Rename the temporary table to the original name
        await queryRunner.query(`
            ALTER TABLE "temporary_app_connection" RENAME TO "app_connection"
        `)

        // Recreate the indexes
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id" ON "app_connection" ("platformId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_project_ids_and_external_id" ON "app_connection" ("projectIds", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back the old mcpId column
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD COLUMN "mcpId" varchar(21)
        `)

        // Copy data back from mcp_piece to app_connection
        await queryRunner.query(`
            UPDATE "app_connection" 
            SET "mcpId" = (
                SELECT "mcpId" 
                FROM "mcp_piece" 
                WHERE "app_connection"."id" = "mcp_piece"."connectionId"
            )
            WHERE EXISTS (
                SELECT 1 
                FROM "mcp_piece" 
                WHERE "app_connection"."id" = "mcp_piece"."connectionId"
            )
        `)

        // Create index for mcpId
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_mcp_id" ON "app_connection" ("mcpId")
        `)

        // Drop the mcp_piece table with all its constraints and indices
        await queryRunner.query(`
            DROP TABLE IF EXISTS "mcp_piece"
        `)
    }
}