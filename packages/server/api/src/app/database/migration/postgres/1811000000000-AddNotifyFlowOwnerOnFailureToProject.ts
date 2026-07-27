import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddNotifyFlowOwnerOnFailureToProject1811000000000 implements Migration {
    name = 'AddNotifyFlowOwnerOnFailureToProject1811000000000'
    breaking = false
    release = '0.86.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "notifyFlowOwnerOnFailure" boolean NOT NULL DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "notifyFlowOwnerOnFailure"
        `)
    }
}
