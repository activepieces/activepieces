import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class RenameNotifications1683195711242 implements MigrationInterface {
    name = 'RenameNotifications1683195711242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('Running migration: RenameNotifications1683195711242')
        await queryRunner.query(
            'ALTER TABLE "project" RENAME COLUMN "notifications" TO "notifyStatus"',
        )
        logger.info('Migration complete: RenameNotifications1683195711242')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "project" RENAME COLUMN "notifyStatus" TO "notifications"',
        )
    }
}
