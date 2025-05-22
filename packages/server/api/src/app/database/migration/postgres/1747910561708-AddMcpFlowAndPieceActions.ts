import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMcpFlowAndPieceActions1747910561708 implements MigrationInterface {
    name = 'AddMcpFlowAndPieceActions1747910561708'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."mcp_project_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_flow" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "flowId" character varying(21) NOT NULL,
                "mcpId" character varying(21) NOT NULL,
                CONSTRAINT "pk_mcp_flow" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_mcp_id" ON "mcp_flow" ("mcpId")
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
            DROP INDEX "public"."idx_mcp_flow_mcp_id"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_flow"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `);
    }

}
