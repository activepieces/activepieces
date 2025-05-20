import { apId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { mcpService } from '../../../mcp/mcp-server/mcp-service'
import { mcpActionService } from '../../../mcp/mcp-tools/mcp-action-service'
import { pieceMetadataService } from '../../../pieces/piece-metadata-service'
import { projectService } from '../../../project/project-service'

export class ReplaceMcpPieceByMcpAction1747677222538 implements MigrationInterface {
    name = 'ReplaceMcpPieceByMcpAction1747677222538'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create mcp_action table
        await queryRunner.query(`
            CREATE TABLE "mcp_action" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "actionName" character varying NOT NULL,
                "pieceName" character varying NOT NULL,
                "pieceVersion" character varying NOT NULL,
                "mcpId" character varying(21) NOT NULL,
                "connectionId" character varying(21),
                CONSTRAINT "pk_mcp_action" PRIMARY KEY ("id")
            )
        `)

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_action_mcp_id" ON "mcp_action" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_action_connection_id" ON "mcp_action" ("connectionId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_action_mcp_id_piece_name_action_name" 
            ON "mcp_action" ("mcpId", "pieceName", "actionName")
        `)

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "mcp_action"
            ADD CONSTRAINT "fk_mcp_action_connection_id" 
            FOREIGN KEY ("connectionId") REFERENCES "app_connection"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_action"
            ADD CONSTRAINT "fk_mcp_action_mcp_id" 
            FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        // Migrate data from mcp_piece to mcp_action
        const mcpPieces = await queryRunner.query(`
            SELECT * FROM "mcp_piece"
        `)

        const logger = system.globalLogger() as FastifyBaseLogger
        
        for (const mcpPiece of mcpPieces) {
            const mcp = await mcpService(logger).getOrThrow({ mcpId: mcpPiece.mcpId })
            const projectId = mcp.projectId
            const platformId = await projectService.getPlatformId(projectId)
            const piece = await pieceMetadataService(logger).getOrThrow({
                name: mcpPiece.pieceName,
                version: undefined,
                projectId,
                platformId,
            })

            for (const [actionName, action] of Object.entries(piece.actions)) {
                const actionId = apId()
                await queryRunner.query(`
                    INSERT INTO "mcp_action" (
                        "id", "created", "updated", "actionName", 
                        "pieceName", "pieceVersion", "mcpId", "connectionId"
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    actionId,
                    mcpPiece.created,
                    mcpPiece.updated,
                    actionName,
                    piece.name,
                    piece.version,
                    mcpPiece.mcpId,
                    mcpPiece.connectionId,
                ])
            }
        }

        // Drop the old mcp_piece table
        await queryRunner.query(`
            ALTER TABLE "mcp_piece" DROP CONSTRAINT IF EXISTS "fk_mcp_piece_mcp_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_piece" DROP CONSTRAINT IF EXISTS "fk_mcp_piece_connection_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id_piece_name"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_connection_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_piece"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the mcp_piece table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mcp_piece" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "pieceName" character varying NOT NULL,
                "mcpId" character varying(21) NOT NULL,
                "connectionId" character varying(21),
                "status" character varying DEFAULT 'ENABLED' NOT NULL,
                CONSTRAINT "PK_mcp_piece" PRIMARY KEY ("id"),
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId")
            )
        `)

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" 
            ON "mcp_piece" ("mcpId", "pieceName")
        `)

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
            ADD CONSTRAINT "fk_mcp_piece_connection_id" 
            FOREIGN KEY ("connectionId") REFERENCES "app_connection"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
            ADD CONSTRAINT "fk_mcp_piece_mcp_id" 
            FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        // Restore data
        const uniquePieces = await queryRunner.query(`
            SELECT DISTINCT "pieceName", "mcpId", "connectionId", "created", "updated"
            FROM "mcp_action"
        `)

        for (const piece of uniquePieces) {
            const pieceId = apId()
            await queryRunner.query(`
                INSERT INTO "mcp_piece" (
                    "id", "created", "updated", "pieceName", 
                    "mcpId", "connectionId", "status"
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                pieceId,
                piece.created,
                piece.updated,
                piece.pieceName,    
                piece.mcpId,
                piece.connectionId,
                'ENABLED',
            ])
        }

        // Drop the mcp_action table
        await queryRunner.query(`
            ALTER TABLE "mcp_action" DROP CONSTRAINT "fk_mcp_action_mcp_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_action" DROP CONSTRAINT "fk_mcp_action_connection_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_action_mcp_id_piece_name_action_name"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_action_connection_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_action_mcp_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_action"
        `)
    }
}
