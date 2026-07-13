import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFlowOwnerAlertsEnabledToProject1810000000000 implements Migration {
    name = 'AddFlowOwnerAlertsEnabledToProject1810000000000'
    breaking = false
    release = '0.103.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "flowOwnerAlertsEnabled" boolean NOT NULL DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "flowOwnerAlertsEnabled"
        `)
    }
}
