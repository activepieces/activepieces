import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddMcpOAuthTokenClientListing1830000000000 implements Migration {
    name = 'AddMcpOAuthTokenClientListing1830000000000'
    breaking = false
    release = '0.88.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_oauth_token"
            ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP WITH TIME ZONE
        `)
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_mcp_oauth_token_project_revoked"
            ON "mcp_oauth_token" ("projectId", "revoked")
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_mcp_oauth_token_user_revoked"
            ON "mcp_oauth_token" ("userId", "revoked")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_mcp_oauth_token_user_revoked"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_mcp_oauth_token_project_revoked"')
        await queryRunner.query('ALTER TABLE "mcp_oauth_token" DROP COLUMN IF EXISTS "lastUsedAt"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
