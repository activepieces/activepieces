import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class ProjectNotifyStatusNotNull1683458275525
implements MigrationInterface {
    name = 'ProjectNotifyStatusNotNull1683458275525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'UPDATE "project" SET "notifyStatus" = \'ALWAYS\' WHERE "notifyStatus" IS NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "project" ALTER COLUMN "notifyStatus" SET NOT NULL',
        )

        log.info('[ProjectNotifyStatusNotNull1683458275525] up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "project" ALTER COLUMN "notifyStatus" DROP NOT NULL',
        )
        await queryRunner.query(
            'UPDATE "project" SET "notifyStatus" = NULL WHERE "notifyStatus" = \'ALWAYS\'',
        )

        log.info('[ProjectNotifyStatusNotNull1683458275525] down')
    }
}
