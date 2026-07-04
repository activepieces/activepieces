import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEnabledToolsToMcpServer1772027509096 implements MigrationInterface {
    name = 'AddEnabledToolsToMcpServer1772027509096'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD "enabledTools" jsonb
        `)
        // Existing rows will have enabledTools = null.
        // The runtime treats null as "all tools enabled" for backward compatibility
        // (see mcp-service.ts: mcp.enabledTools ?? ALL_CONTROLLABLE_TOOL_NAMES).
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server" DROP COLUMN "enabledTools"
        `)
    }
}
