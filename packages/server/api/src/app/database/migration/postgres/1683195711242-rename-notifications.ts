import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class RenameNotifications1683195711242 implements MigrationInterface {
    name = 'RenameNotifications1683195711242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('Running migration: RenameNotifications1683195711242')
        await queryRunner.query(
            'ALTER TABLE "project" RENAME COLUMN "notifications" TO "notifyStatus"',
        )
        log.info('Migration complete: RenameNotifications1683195711242')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "project" RENAME COLUMN "notifyStatus" TO "notifications"',
        )
    }
}
