import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpRunEntity1748358415599 implements MigrationInterface {
    name = 'AddMcpRunEntity1748358415599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp_run" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "mcpId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "toolId" character varying(21),
                "metadata" jsonb NOT NULL,
                "input" jsonb NOT NULL,
                "output" jsonb NOT NULL,
                "status" character varying NOT NULL,
                CONSTRAINT "PK_269f79a2f8cc476c30fee296741" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_mcp_id" ON "mcp_run" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_tool_id" ON "mcp_run" ("toolId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_run_project_id" ON "mcp_run" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_run"
            ADD CONSTRAINT "fk_mcp_run_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_run"
            ADD CONSTRAINT "fk_mcp_run_tool_id" FOREIGN KEY ("toolId") REFERENCES "mcp_tool"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_run"
            ADD CONSTRAINT "fk_mcp_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_run" DROP CONSTRAINT "fk_mcp_run_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_run" DROP CONSTRAINT "fk_mcp_run_tool_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_run" DROP CONSTRAINT "fk_mcp_run_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_tool_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_run_mcp_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_run"
        `)
    }

}
