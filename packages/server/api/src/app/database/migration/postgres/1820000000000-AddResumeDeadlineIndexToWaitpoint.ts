import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddResumeDeadlineIndexToWaitpoint1820000000000 implements Migration {
    name = 'AddResumeDeadlineIndexToWaitpoint1820000000000'
    breaking = false
    release = '0.86.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_waitpoint_pending_resume_date_time"
            ON "waitpoint" ("resumeDateTime")
            WHERE "status" = 'PENDING' AND "resumeDateTime" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_waitpoint_pending_resume_date_time"
        `)
    }
}
