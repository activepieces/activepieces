import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class WidenMcpOAuthState1835000000000 implements Migration {
    name = 'WidenMcpOAuthState1835000000000'
    release = '0.88.3'
    breaking = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "mcp_oauth_authorization_code" ALTER COLUMN "state" TYPE character varying(2048)')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('UPDATE "mcp_oauth_authorization_code" SET "state" = NULL WHERE length("state") > 512')
        await queryRunner.query('ALTER TABLE "mcp_oauth_authorization_code" ALTER COLUMN "state" TYPE character varying(512)')
    }
}
