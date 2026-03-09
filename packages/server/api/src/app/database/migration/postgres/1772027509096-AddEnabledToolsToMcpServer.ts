import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEnabledToolsToMcpServer1772027509096 implements MigrationInterface {
    name = 'AddEnabledToolsToMcpServer1772027509096'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD "enabledTools" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server" DROP COLUMN "enabledTools"
        `)
    }
}
