import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropLegacyTables1766015156683 implements MigrationInterface {
    name = 'DropLegacyTables1766015156683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "mcp_server" IF EXISTS')
        await queryRunner.query('DROP TABLE "mcp_tool" IF EXISTS')
        await queryRunner.query('DROP TABLE "mcp_run" IF EXISTS')
        await queryRunner.query('DROP TABLE "issue" IF EXISTS')
        await queryRunner.query('DROP TABLE "ai_usage" IF EXISTS')
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Do nothing        
    }

}
