import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class StoreAllPeriods1681019096716 implements MigrationInterface {
    name = 'StoreAllPeriods1681019096716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('Running StoreAllPeriods1681019096716')
        await queryRunner.query(
            'ALTER TABLE "project_usage" DROP CONSTRAINT "REL_c407fc9b2bfb44515af69d575a"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_project_usage_project_id"',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_project_usage_project_id" ON "project_usage" ("projectId") ',
        )
        log.info('Finished Running StoreAllPeriods1681019096716')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "project_usage" ADD CONSTRAINT "REL_c407fc9b2bfb44515af69d575a" UNIQUE ("projectId")',
        )
        await queryRunner.query(
            'DROP INDEX "idx_project_usage_project_id"',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_project_usage_project_id" ON "project_usage" ("projectId") ',
        )
    }
}
