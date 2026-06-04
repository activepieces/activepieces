import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class RemoveMcpServerStatus1790000000000 implements Migration {
    name = 'RemoveMcpServerStatus1790000000000'
    breaking = false
    release = '0.82.1'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            DROP COLUMN "status"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD COLUMN "status" varchar NOT NULL DEFAULT 'ENABLED'
        `)
    }
}
