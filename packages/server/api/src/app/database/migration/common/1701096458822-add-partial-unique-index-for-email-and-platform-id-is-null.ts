import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddPartialUniqueIndexForEmailAndPlatformIdIsNull1701096458822
implements MigrationInterface {
    name = 'AddPartialUniqueIndexForEmailAndPlatformIdIsNull1701096458822'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_partial_unique_email_platform_id_is_null"
            ON "user"("email") WHERE "platformId" IS NULL
        `)

        log.info(
            'AddPartialUniqueIndexForEmailAndPlatformIdIsNull1701096458822 up',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "user_partial_unique_email_platform_id_is_null"
        `)

        log.info(
            'AddPartialUniqueIndexForEmailAndPlatformIdIsNull1701096458822 down',
        )
    }
}
