import { MigrationInterface, QueryRunner } from "typeorm";
import { pieceMetadataService } from "../../../pieces/piece-metadata-service";
import { system } from "../../../helper/system/system";


export class AddMcpFlowAndPieceActions1747917306587 implements MigrationInterface {
    name = 'AddMcpFlowAndPieceActions1747917306587'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const logger = system.globalLogger()

        await queryRunner.query(`
            DROP INDEX "public"."mcp_project_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_piece_mcp_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_flow" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "flowId" character varying(21) NOT NULL,
                "mcpId" character varying(21) NOT NULL,
                CONSTRAINT "PK_4ab889ada17f77f05239f005048" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_flow_id" ON "mcp_flow" ("flowId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_flow_mcp_id_flow_id" ON "mcp_flow" ("mcpId", "flowId")
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece" DROP COLUMN "status"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "name" character varying NOT NULL DEFAULT 'MCP Server'
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
            ADD "pieceVersion" character varying NOT NULL
        `);

        // const allMcpPieces = await queryRunner.query(`
        //     SELECT * FROM "mcp_piece"
        // `);
        // for (const mcpPiece of allMcpPieces) {
        //     console.log(`HAHAHAHAAH mcpPiece`, mcpPiece)
        //     const pieceMetadata = await pieceMetadataService(logger).getOrThrow({
        //         name: mcpPiece.pieceName,
        //         version: undefined,
        //         projectId: mcpPiece.projectId,
        //         platformId: mcpPiece.platformId,
        //     })
            
        //     await queryRunner.query(`
        //         UPDATE "mcp_piece" SET "pieceVersion" = $1 WHERE "id" = $2
        //     `, [pieceMetadata.version, mcpPiece.id]);
        // }
        

        // await queryRunner.query(`
        //     ALTER TABLE "mcp_piece"
        //     ALTER COLUMN "pieceVersion" SET NOT NULL
        // `);


        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
            ADD "actionNames" character varying NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
            ADD CONSTRAINT "fk_mcp_action_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_flow"
            ADD CONSTRAINT "fk_mcp_flow_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_flow"
            ADD CONSTRAINT "fk_mcp_flow_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_flow" DROP CONSTRAINT "fk_mcp_flow_flow_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_flow" DROP CONSTRAINT "fk_mcp_flow_mcp_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece" DROP CONSTRAINT "fk_mcp_action_mcp_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."mcp_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece" DROP COLUMN "actionNames"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece" DROP COLUMN "pieceVersion"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "name"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
            ADD "status" character varying NOT NULL DEFAULT 'ENABLED'
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_flow_mcp_id_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_flow_flow_id"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_flow"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `);
    }

}
