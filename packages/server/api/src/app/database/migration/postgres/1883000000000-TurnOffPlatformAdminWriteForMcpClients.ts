import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class TurnOffPlatformAdminWriteForMcpClients1883000000000 implements Migration {
    name = 'TurnOffPlatformAdminWriteForMcpClients1883000000000'
    breaking = false
    release = '0.95.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "mcp_server"
            SET "disabledTools" = COALESCE("disabledTools", '[]'::jsonb) || '["ap_platform_write"]'::jsonb
            WHERE "type" = 'PLATFORM'
            AND NOT COALESCE("disabledTools", '[]'::jsonb) ? 'ap_platform_write'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "mcp_server"
            SET "disabledTools" = "disabledTools" - 'ap_platform_write'
            WHERE "type" = 'PLATFORM'
            AND "disabledTools" ? 'ap_platform_write'
        `)
    }
}
