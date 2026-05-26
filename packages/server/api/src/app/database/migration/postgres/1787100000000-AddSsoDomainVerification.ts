import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class AddSsoDomainVerification1787100000000 implements Migration {
    name = 'AddSsoDomainVerification1787100000000'
    breaking = false
    release = '0.83.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite ? '' : 'CONCURRENTLY'

        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN IF NOT EXISTS "ssoDomain" character varying
        `)

        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN IF NOT EXISTS "ssoDomainVerification" jsonb
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX ${concurrently} IF NOT EXISTS "idx_platform_sso_domain"
            ON "platform" ("ssoDomain")
            WHERE "ssoDomain" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite ? '' : 'CONCURRENTLY'

        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_platform_sso_domain"`)
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "ssoDomainVerification"')
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "ssoDomain"')
    }
}
