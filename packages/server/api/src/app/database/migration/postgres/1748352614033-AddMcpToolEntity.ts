import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpToolEntity1748352614033 implements MigrationInterface {
    name = 'AddMcpToolEntity1748352614033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."mcp_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_tool" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "mcpId" character varying(21) NOT NULL,
                "type" character varying NOT NULL,
                "pieceMetadata" jsonb,
                "flowId" character varying,
                CONSTRAINT "PK_ba54d700cb4059f5f48121840bd" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_mcp_id" ON "mcp_tool" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_flow_id" ON "mcp_tool" ("flowId")
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "name" character varying NOT NULL DEFAULT 'MCP Server'
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
            ADD CONSTRAINT "FK_ff5eb8d6e2b6375d0d98569d5fb" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
            ADD CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_tool" DROP CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool" DROP CONSTRAINT "FK_ff5eb8d6e2b6375d0d98569d5fb"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."mcp_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "name"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_tool_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_tool_mcp_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_tool"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
    }

}
