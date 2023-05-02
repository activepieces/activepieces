import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../helper/logger'
export class AllowNullableStoreEntry1683040965874 implements MigrationInterface {
    name = 'AllowNullableStoreEntry1683040965874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('AllowNullableStoreEntry1683040965874, started')
        await queryRunner.query('ALTER TABLE "store-entry" ALTER COLUMN "value" DROP NOT NULL')
        logger.info('AllowNullableStoreEntry1683040965874, ended')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "store-entry" ALTER COLUMN "value" SET NOT NULL')
    }

}
