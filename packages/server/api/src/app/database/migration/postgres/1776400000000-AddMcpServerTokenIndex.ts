import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddMcpServerTokenIndex1776400000000 implements Migration {
    name = 'AddMcpServerTokenIndex1776400000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_mcp_server_token"
            ON "mcp_server" ("token")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_mcp_server_token"')
    }
}
