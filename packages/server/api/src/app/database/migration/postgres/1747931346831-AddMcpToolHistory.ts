import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMcpToolHistory1747931346831 implements MigrationInterface {
    name = 'AddMcpToolHistory1747931346831'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp_piece_tool_history" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "mcpId" character varying(21) NOT NULL,
                "pieceName" character varying NOT NULL,
                "pieceVersion" character varying NOT NULL,
                "toolName" character varying NOT NULL,
                "input" jsonb NOT NULL,
                "output" jsonb NOT NULL,
                "success" boolean NOT NULL,
                CONSTRAINT "PK_mcp_piece_tool_history" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_tool_history_mcp_id" ON "mcp_piece_tool_history" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_flow_tool_history" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "mcpId" character varying(21) NOT NULL,
                "flowId" character varying(21) NOT NULL,
                "flowVersionId" character varying(21) NOT NULL,
                "toolName" character varying NOT NULL,
                "input" jsonb NOT NULL,
                "output" jsonb NOT NULL,
                "success" boolean NOT NULL,
                CONSTRAINT "PK_mcp_flow_tool_history" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_tool_history_mcp_id" ON "mcp_flow_tool_history" ("mcpId")
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece_tool_history"
            ADD CONSTRAINT "fk_mcp_piece_tool_history_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_flow_tool_history"
            ADD CONSTRAINT "fk_mcp_flow_tool_history_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_flow_tool_history" DROP CONSTRAINT "fk_mcp_flow_tool_history_mcp_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece_tool_history" DROP CONSTRAINT "fk_mcp_piece_tool_history_mcp_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_flow_tool_history_mcp_id"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_flow_tool_history"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_piece_tool_history_mcp_id"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_piece_tool_history"
        `);
    }

}
