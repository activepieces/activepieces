import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class FileTypeCompression1694691554696 implements MigrationInterface {
    name = 'FileTypeCompression1694691554696'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "file" ADD "type" character varying NOT NULL DEFAULT \'UNKNOWN\'',
        )
        await queryRunner.query(
            'ALTER TABLE "file" ADD "compression" character varying NOT NULL DEFAULT \'NONE\'',
        )

        logger.info('[FileTypeCompression1694691554696] up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "file" DROP COLUMN "compression"')
        await queryRunner.query('ALTER TABLE "file" DROP COLUMN "type"')

        logger.info('[FileTypeCompression1694691554696] down')
    }
}
