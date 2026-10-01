import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddWaitpointSignals1821000000000 implements Migration {
    name = 'AddWaitpointSignals1821000000000'
    breaking = false
    release = '0.87.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD COLUMN IF NOT EXISTS "sealed" boolean NOT NULL DEFAULT false
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD COLUMN IF NOT EXISTS "policy" jsonb
        `)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_waitpoint_pending_resume_date_time"`)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_waitpoint_pending_resume_date_time"
            ON "waitpoint" ("resumeDateTime")
            WHERE "status" = 'PENDING' AND "resumeDateTime" IS NOT NULL
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "waitpoint_signal" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "waitpointId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "status" character varying NOT NULL,
                "refId" character varying,
                "sequence" integer,
                "label" character varying,
                "result" jsonb,
                CONSTRAINT "PK_waitpoint_signal" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_waitpoint_signal_waitpoint_id') THEN
                    ALTER TABLE "waitpoint_signal"
                    ADD CONSTRAINT "fk_waitpoint_signal_waitpoint_id"
                    FOREIGN KEY ("waitpointId") REFERENCES "waitpoint"("id")
                    ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END $$
        `)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_waitpoint_signal_waitpoint_id_project_id_status"`)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_waitpoint_signal_waitpoint_id_project_id_status"
            ON "waitpoint_signal" ("waitpointId", "projectId", "status")
        `)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_waitpoint_signal_ref_id"`)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_waitpoint_signal_ref_id"
            ON "waitpoint_signal" ("refId")
        `)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_waitpoint_signal_waitpoint_id_sequence"`)
        await queryRunner.query(`
            CREATE UNIQUE INDEX ${concurrently()} IF NOT EXISTS "idx_waitpoint_signal_waitpoint_id_sequence"
            ON "waitpoint_signal" ("waitpointId", "sequence")
            WHERE "sequence" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "waitpoint_signal"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_waitpoint_pending_resume_date_time"')
        await queryRunner.query('ALTER TABLE "waitpoint" DROP COLUMN IF EXISTS "policy"')
        await queryRunner.query('ALTER TABLE "waitpoint" DROP COLUMN IF EXISTS "sealed"')
    }
}

const concurrently = (): string => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE ? '' : 'CONCURRENTLY'
