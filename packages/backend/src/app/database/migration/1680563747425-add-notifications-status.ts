import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../helper/logger'

export class addNotificationsStatus1680563747425 implements MigrationInterface {
    name = 'addNotificationsStatus1680563747425'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('Running migration: addNotificationsStatus1680563747425')
        await queryRunner.query('ALTER TABLE "project" ADD "notifyStatus" character varying')
        await queryRunner.query('UPDATE "project" SET "notifyStatus" = \'ALWAYS\'')
        logger.info('Completed migration: addNotificationsStatus1680563747425')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "project" DROP COLUMN "notifyStatus"')
    }

}
