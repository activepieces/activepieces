import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddMcpOAuthTokenPlatformListing1831000000000 implements Migration {
    name = 'AddMcpOAuthTokenPlatformListing1831000000000'
    breaking = false
    release = '0.88.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_mcp_oauth_token_platform_revoked"
            ON "mcp_oauth_token" ("platformId", "revoked")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_mcp_oauth_token_platform_revoked"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
