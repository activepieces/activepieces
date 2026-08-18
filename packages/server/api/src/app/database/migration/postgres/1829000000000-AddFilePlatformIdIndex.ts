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
                CREATE INDEX IF NOT EXISTS "idx_file_platform_id"
                ON "file" ("platformId")
            `)
            return
        }
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_class c
                    JOIN pg_index i ON i.indexrelid = c.oid
                    WHERE c.relname = 'idx_file_platform_id' AND NOT i.indisvalid
                ) THEN
                    EXECUTE 'DROP INDEX CONCURRENTLY IF EXISTS "idx_file_platform_id"';
                END IF;
            END $$
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_file_platform_id"
            ON "file" ("platformId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_file_platform_id"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
