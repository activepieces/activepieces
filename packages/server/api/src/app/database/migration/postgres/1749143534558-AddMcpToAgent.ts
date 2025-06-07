import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMcpToAgent1749143534558 implements MigrationInterface {
    name = 'AddMcpToAgent1749143534558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "agentId" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD "mcpId" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ALTER COLUMN "name" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "token"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "token" character varying NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `);
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD CONSTRAINT "FK_75a2334b21976600a591eebc31a" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent" DROP CONSTRAINT "FK_75a2334b21976600a591eebc31a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."mcp_agent_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "token"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "token" character varying(21) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ALTER COLUMN "name"
            SET DEFAULT 'MCP Server'
        `);
        await queryRunner.query(`
            ALTER TABLE "agent" DROP COLUMN "mcpId"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "agentId"
        `);
    }

}
