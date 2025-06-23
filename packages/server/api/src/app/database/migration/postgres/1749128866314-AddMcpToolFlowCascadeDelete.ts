import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpToolFlowCascadeDelete1749128866314 implements MigrationInterface {
    name = 'AddMcpToolFlowCascadeDelete1749128866314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_tool" DROP CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
            ADD CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_tool" DROP CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_tool"
            ADD CONSTRAINT "FK_3f26c7b876fba48b9e90efb3d79" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

}
