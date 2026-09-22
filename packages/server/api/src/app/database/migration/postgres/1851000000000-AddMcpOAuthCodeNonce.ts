import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddMcpOAuthCodeNonce1851000000000 implements Migration {
    name = 'AddMcpOAuthCodeNonce1851000000000'
    breaking = false
    release = '0.92.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_oauth_authorization_code"
            ADD COLUMN IF NOT EXISTS "nonce" character varying(512)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_oauth_authorization_code"
            DROP COLUMN IF EXISTS "nonce"
        `)
    }
}
