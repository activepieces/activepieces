import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveAgentidFromMcpEntity1760452015041 implements MigrationInterface {
    name = 'RemoveAgentidFromMcpEntity1760452015041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP CONSTRAINT "fk_mcp_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "agentId"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "agentId" character varying
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD CONSTRAINT "fk_mcp_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}
