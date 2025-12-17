import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropLegacyTables1766015156683 implements MigrationInterface {
    name = 'DropLegacyTables1766015156683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "mcp_server"')
        await queryRunner.query('DROP TABLE IF EXISTS "mcp_tool"')
        await queryRunner.query('DROP TABLE IF EXISTS "mcp_run"')
        await queryRunner.query('DROP TABLE IF EXISTS "issue"')
        await queryRunner.query('DROP TABLE IF EXISTS "ai_usage"')
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Do nothing        
    }

}
