import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFanInToWaitpoint1818000000000 implements Migration {
    name = 'AddFanInToWaitpoint1818000000000'
    breaking = false
    release = '0.86.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD "isFanIn" boolean NOT NULL DEFAULT false
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD "expectedChildren" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD "failedToDispatch" integer NOT NULL DEFAULT 0
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD "fanInBaseline" jsonb
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_waitpoint_flow_run_id_is_fan_in_status"
            ON "waitpoint" ("flowRunId", "isFanIn", "status")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_waitpoint_flow_run_id_is_fan_in_status"
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint" DROP COLUMN "fanInBaseline"
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint" DROP COLUMN "failedToDispatch"
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint" DROP COLUMN "expectedChildren"
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint" DROP COLUMN "isFanIn"
        `)
    }
}
