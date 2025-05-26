import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpToolHistory1748282988335 implements MigrationInterface {
    name = 'AddMcpToolHistory1748282988335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."mcp_tool_history_status_enum" AS ENUM('Success', 'Failed')
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_tool_history" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "mcpId" character varying(21) NOT NULL,
                "toolId" character varying(21) NOT NULL,
                "metadata" jsonb NOT NULL,
                "input" jsonb NOT NULL,
                "output" jsonb NOT NULL,
                "status" character varying NOT NULL,
                CONSTRAINT "PK_c225b88f2595007c3ea704b8a8b" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_history_mcp_id" ON "mcp_tool_history" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_tool_history_tool_id" ON "mcp_tool_history" ("toolId")
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool_history"
            ADD CONSTRAINT "fk_mcp_tool_history_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool_history"
            ADD CONSTRAINT "fk_mcp_tool_history_tool_id" FOREIGN KEY ("toolId") REFERENCES "mcp_tool"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_tool_history" DROP CONSTRAINT "fk_mcp_tool_history_tool_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool_history" DROP CONSTRAINT "fk_mcp_tool_history_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_tool_history_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_mcp_tool_history_mcp_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_tool_history"
        `)
        await queryRunner.query(`
            DROP TYPE "public"."mcp_tool_history_status_enum"
        `)
    }

}
