import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddFilePlatformIdIndex1829000000000 implements Migration {
    name = 'AddFilePlatformIdIndex1829000000000'
    breaking = false
    release = '0.88.1'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_file_platform_id_null_project"
                ON "file" ("platformId")
                WHERE "projectId" IS NULL
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_file_platform_id_null_project"
                ON "file" ("platformId")
                WHERE "projectId" IS NULL
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_file_platform_id_null_project"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
