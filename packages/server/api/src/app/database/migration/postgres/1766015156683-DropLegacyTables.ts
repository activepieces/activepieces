import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropLegacyTables1766015156683 implements MigrationInterface {
    name = 'DropLegacyTables1766015156683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "mcp_run"')
        await queryRunner.query('DROP TABLE IF EXISTS "issue"')
        await queryRunner.query('DROP TABLE IF EXISTS "ai_usage"')

        await queryRunner.query(`
            ALTER TABLE "mcp_server" DROP CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server" DROP CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

}
