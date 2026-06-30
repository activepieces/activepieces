import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddTimelineToFlowRun1800000000000 implements Migration {
    name = 'AddTimelineToFlowRun1800000000000'
    breaking = false
    release = '0.84.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" ADD COLUMN IF NOT EXISTS "timeline" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN IF EXISTS "timeline"
        `)
    }

}
