import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddActiveFlowsLimitToProjectPlan1807000000000 implements Migration {
    name = 'AddActiveFlowsLimitToProjectPlan1807000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "activeFlowsLimit" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "activeFlowsLimit"
        `)
    }
}
