import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddMcpActivityClientKey1841000000000 implements Migration {
    name = 'AddMcpActivityClientKey1841000000000'
    breaking = false
    release = '0.89.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_activity"
            ADD COLUMN IF NOT EXISTS "clientKey" character varying(32)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "mcp_activity" DROP COLUMN IF EXISTS "clientKey"')
    }
}
