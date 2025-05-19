import { apId } from "@activepieces/shared";
import { FastifyBaseLogger } from "fastify";
import { pieceMetadataService } from "../../../pieces/piece-metadata-service";
import { projectService } from "../../../project/project-service";
import { mcpService } from "../../../mcp/mcp-server/mcp-service";
import { MigrationInterface, QueryRunner } from "typeorm";
import { system } from "../../../helper/system/system";

export class ReplaceMcpPieceByMcpActionSqlite1747678999987 implements MigrationInterface {
    name = 'ReplaceMcpPieceByMcpActionSqlite1747678999987'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp_action" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "actionName" varchar NOT NULL,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                CONSTRAINT "fk_mcp_action_connection_id" FOREIGN KEY ("connectionId") 
                    REFERENCES "app_connection" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
                CONSTRAINT "fk_mcp_action_mcp_id" FOREIGN KEY ("mcpId") 
                    REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_mcp_action_mcp_id" ON "mcp_action" ("mcpId")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_mcp_action_connection_id" ON "mcp_action" ("connectionId")
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_action_mcp_id_piece_name_action_name" 
            ON "mcp_action" ("mcpId", "pieceName", "actionName")
        `);

        // Migrate data from mcp_piece to mcp_action
        const mcpPieces = await queryRunner.query(`
            SELECT * FROM "mcp_piece"
        `);

        const logger = system.globalLogger() as FastifyBaseLogger;
        
        for (const mcpPiece of mcpPieces) {
            const mcp = await mcpService(logger).getOrThrow({ mcpId: mcpPiece.mcpId });
            const projectId = mcp.projectId;
            const platformId = await projectService.getPlatformId(projectId);
            const piece = await pieceMetadataService(logger).getOrThrow({
                name: mcpPiece.pieceName,
                version: undefined,
                projectId,
                platformId,
            });

            for (const [actionName, action] of Object.entries(piece.actions)) {
                const actionId = apId();
                await queryRunner.query(`
                    INSERT INTO "mcp_action" (
                        "id", "created", "updated", "actionName", 
                        "pieceName", "pieceVersion", "mcpId", "connectionId"
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    actionId, 
                    mcpPiece.created, 
                    mcpPiece.updated, 
                    actionName, 
                    piece.name, 
                    piece.version, 
                    mcpPiece.mcpId, 
                    mcpPiece.connectionId
                ]);
            }
        }

        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_mcp_piece_mcp_id_piece_name"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_mcp_piece_connection_id"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_mcp_piece_mcp_id"
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "mcp_piece"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                CONSTRAINT "fk_mcp_piece_mcp_id" FOREIGN KEY ("mcpId") 
                    REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_mcp_piece_connection_id" FOREIGN KEY ("connectionId") 
                    REFERENCES "app_connection" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

        // Restore data
        const uniquePieces = await queryRunner.query(`
            SELECT DISTINCT "pieceName", "mcpId", "connectionId", "created", "updated"
            FROM "mcp_action"
        `);

        for (const piece of uniquePieces) {
            const pieceId = apId();
            await queryRunner.query(`
                INSERT INTO "mcp_piece" (
                    "id", "created", "updated", "pieceName", 
                    "mcpId", "connectionId", "status"
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                pieceId,
                piece.created,
                piece.updated,
                piece.pieceName,    
                piece.mcpId,
                piece.connectionId,
                'ENABLED'
            ]);
        }

        await queryRunner.query(`
            DROP INDEX "idx_mcp_action_mcp_id_piece_name_action_name"
        `);

        await queryRunner.query(`
            DROP INDEX "idx_mcp_action_connection_id"
        `);

        await queryRunner.query(`
            DROP INDEX "idx_mcp_action_mcp_id"
        `);

        await queryRunner.query(`
            DROP TABLE "mcp_action"
        `);
    }
}
