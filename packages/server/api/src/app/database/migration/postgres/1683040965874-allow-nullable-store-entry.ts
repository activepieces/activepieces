import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AllowNullableStoreEntryAndTrigger1683040965874
implements MigrationInterface {
    name = 'AllowNullableStoreEntryAndTrigger1683040965874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('AllowNullableStoreEntryAndTrigger1683040965874, started')
        await queryRunner.query(
            'ALTER TABLE "store-entry" ALTER COLUMN "value" DROP NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "trigger_event" ALTER COLUMN "payload" DROP NOT NULL',
        )
        log.info('AllowNullableStoreEntryAndTrigger1683040965874, ended')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "trigger_event" ALTER COLUMN "payload" SET NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "store-entry" ALTER COLUMN "value" SET NOT NULL',
        )
    }
}
