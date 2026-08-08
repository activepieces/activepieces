import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddDispatchTrackingToFanIn1821000000000 implements Migration {
    name = 'AddDispatchTrackingToFanIn1821000000000'
    breaking = false
    release = '0.86.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN IF NOT EXISTS "dispatchIndex" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD COLUMN IF NOT EXISTS "dispatchDigest" character varying(64)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "waitpoint" DROP COLUMN "dispatchDigest"')
        await queryRunner.query('ALTER TABLE "flow_run" DROP COLUMN "dispatchIndex"')
    }
}
