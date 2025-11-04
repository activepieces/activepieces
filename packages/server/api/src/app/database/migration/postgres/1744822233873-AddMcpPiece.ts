import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpPiece1744822233873 implements MigrationInterface {
    name = 'AddMcpPiece1744822233873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        
 
        // Drop the old index
        await queryRunner.query(`
             DROP INDEX IF EXISTS "idx_app_connection_mcp_id"
         `)
 
        // Create the new mcp_piece table
        await queryRunner.query(`
             CREATE TABLE "mcp_piece" (
                 "id" character varying(21) NOT NULL,
                 "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                 "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                 "pieceName" character varying NOT NULL,
                 "mcpId" character varying(21) NOT NULL,
                 "connectionId" character varying(21),
                 "status" character varying DEFAULT 'ENABLED' NOT NULL,
                 CONSTRAINT "pk_mcp_piece" PRIMARY KEY ("id"),
                 CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId"),
                 CONSTRAINT "fk_mcp_piece_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                 CONSTRAINT "fk_mcp_piece_connection_id" FOREIGN KEY ("connectionId") REFERENCES "app_connection"("id") ON DELETE SET NULL ON UPDATE NO ACTION
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
             SELECT id, created, updated, "pieceName", "mcpId"
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
                 ) VALUES (
                     $1,
                     $2,
                     $3,
                     $4,
                     $5,
                     $6,
                     $7
                 )
             `, [pieceId, connection.created, connection.updated, connection.pieceName, connection.mcpId, connection.id, 'ENABLED'])
             
        }
 
        // Drop old mcpId column from app_connection after all data is migrated
        await queryRunner.query(`
             ALTER TABLE "app_connection" DROP COLUMN IF EXISTS "mcpId"
         `)
    }
 
    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraints
        await queryRunner.query(`
             ALTER TABLE "app_connection" DROP CONSTRAINT IF EXISTS "fk_app_connection_mcp_piece_id"
         `)
        await queryRunner.query(`
             ALTER TABLE "mcp_piece" DROP CONSTRAINT IF EXISTS "fk_mcp_piece_connection_id"
         `)
        await queryRunner.query(`
             ALTER TABLE "mcp_piece" DROP CONSTRAINT IF EXISTS "fk_mcp_piece_mcp_id"
         `)
 
        // Drop indices
        await queryRunner.query(`
             DROP INDEX IF EXISTS "idx_app_connection_mcp_piece_id"
         `)
        await queryRunner.query(`
             DROP INDEX IF EXISTS "idx_mcp_piece_mcp_id_piece_name"
         `)
        await queryRunner.query(`
             DROP INDEX IF EXISTS "idx_mcp_piece_connection_id"
         `)
        await queryRunner.query(`
             DROP INDEX IF EXISTS "idx_mcp_piece_mcp_id"
         `)
 
        // Add back the old mcpId column
        await queryRunner.query(`
             ALTER TABLE "app_connection"
             ADD COLUMN "mcpId" character varying(21)
         `)
 
        // Copy data back from mcp_piece to app_connection
        await queryRunner.query(`
             UPDATE "app_connection" ac
             SET "mcpId" = mp.mcpId
             FROM "mcp_piece" mp
             WHERE ac.mcpPieceId = mp.id
         `)
 
        // Drop mcpPieceId column from app_connection
        await queryRunner.query(`
             ALTER TABLE "app_connection" DROP COLUMN IF EXISTS "mcpPieceId"
         `)
 
        // Create old index
        await queryRunner.query(`
             CREATE INDEX "idx_app_connection_mcp_id" ON "app_connection" ("mcpId")
         `)
 
        // Drop the new table
        await queryRunner.query(`
             DROP TABLE IF EXISTS "mcp_piece"
         `)
    }
} 