import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddWaitpointDeadLetteredAt1851000000000 implements Migration {
    name = 'AddWaitpointDeadLetteredAt1851000000000'
    breaking = false
    release = '0.91.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'

        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD COLUMN IF NOT EXISTS "deadLetteredAt" TIMESTAMP WITH TIME ZONE
        `)

        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_waitpoint_live_deadline"
            ON "waitpoint" ("resumeDateTime", "id")
            WHERE "status" = 'PENDING' AND "resumeDateTime" IS NOT NULL AND "deadLetteredAt" IS NULL
        `)

        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_waitpoint_pending_resume_date_time"`)

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

        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_waitpoint_pending_resume_date_time"
            ON "waitpoint" ("resumeDateTime")
            WHERE "status" = 'PENDING' AND "resumeDateTime" IS NOT NULL
        `)

        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_waitpoint_live_deadline"`)
        await queryRunner.query('ALTER TABLE "waitpoint" DROP COLUMN IF EXISTS "deadLetteredAt"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
