import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class AddScheduleOptions1687384796637 implements MigrationInterface {
    name = 'AddScheduleOptions1687384796637'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('Running AddScheduleOptions1687384796637 migration up')
        await queryRunner.query('ALTER TABLE "flow_instance" ADD "schedule" jsonb')
        logger.info('Running AddScheduleOptions1687384796637 migration done')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "flow_instance" DROP COLUMN "schedule"',
        )
    }
}
