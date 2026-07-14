import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddProjectExecutionDataRetentionDays1810000000000 implements Migration {
    name = 'AddProjectExecutionDataRetentionDays1810000000000'
    breaking = false
    release = '0.103.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "executionDataRetentionDays" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "executionDataRetentionDays"
        `)
    }
}
