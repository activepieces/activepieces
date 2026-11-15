import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddMcpOAuthTokenLastUsedAndClientKey1838000000000 implements Migration {
    name = 'AddMcpOAuthTokenLastUsedAndClientKey1838000000000'
    breaking = false
    release = '0.88.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_oauth_token"
            ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP WITH TIME ZONE
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_oauth_token"
            ADD COLUMN IF NOT EXISTS "clientKey" character varying(32)
        `)
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'
        await queryRunner.query('DROP INDEX IF EXISTS "idx_mcp_oauth_token_platform_user_revoked"')
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_mcp_oauth_token_platform_user_revoked_created"
            ON "mcp_oauth_token" ("platformId", "userId", "revoked", "created")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_mcp_oauth_token_platform_user_revoked_created"')
        await queryRunner.query('ALTER TABLE "mcp_oauth_token" DROP COLUMN IF EXISTS "clientKey"')
        await queryRunner.query('ALTER TABLE "mcp_oauth_token" DROP COLUMN IF EXISTS "lastUsedAt"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
