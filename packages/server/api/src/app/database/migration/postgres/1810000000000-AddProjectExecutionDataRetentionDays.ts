import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddProjectExecutionDataRetentionDays1810000000000 implements Migration {
    name = 'AddProjectExecutionDataRetentionDays1810000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "executionDataRetentionDays" integer
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_execution_data_retention_days" ON "project" ("executionDataRetentionDays")
            WHERE "executionDataRetentionDays" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_execution_data_retention_days"
        `)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "executionDataRetentionDays"
        `)
    }
}
