import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddUpdatedByInFlowVersion1689292797727
implements MigrationInterface {
    name = 'AddUpdatedByInFlowVersion1689292797727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('AddUpdatedByInFlowVersion1689292797727 up')
        await queryRunner.query(
            'ALTER TABLE "flow_version" ADD "updatedBy" character varying',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_version" ADD CONSTRAINT "fk_updated_by_user_flow" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        log.info('AddUpdatedByInFlowVersion1689292797727 finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "flow_version" DROP CONSTRAINT "fk_updated_by_user_flow"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_version" DROP COLUMN "updatedBy"',
        )
    }
}
