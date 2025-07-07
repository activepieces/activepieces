import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgents1749405724276 implements MigrationInterface {
    name = 'AddAgents1749405724276'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "agentId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD "mcpId" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ALTER COLUMN "name" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ALTER COLUMN "token" TYPE character varying,
            ALTER COLUMN "token" SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD CONSTRAINT "fk_mcp_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP CONSTRAINT "fk_mcp_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "token"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "token" character varying(21) NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ALTER COLUMN "name"
            SET DEFAULT 'MCP Server'
        `)
        await queryRunner.query(`
            ALTER TABLE "agent" DROP COLUMN "mcpId"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "agentId"
        `)
    }

}
