import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class NarrowWaitpointSignalRefIdIndex1843000000000 implements Migration {
    name = 'NarrowWaitpointSignalRefIdIndex1843000000000'
    breaking = false
    release = '0.91.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'

        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_waitpoint_signal_ref_id"`)
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_waitpoint_signal_ref_id"
            ON "waitpoint_signal" ("refId")
            WHERE "refId" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'

        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_waitpoint_signal_ref_id"`)
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_waitpoint_signal_ref_id"
            ON "waitpoint_signal" ("refId")
        `)
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
