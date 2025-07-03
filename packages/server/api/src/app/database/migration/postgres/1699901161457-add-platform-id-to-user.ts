import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddPlatformIdToUser1699901161457 implements MigrationInterface {
    name = 'AddPlatformIdToUser1699901161457'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "platformId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)

        log.info('AddPlatformIdToUser1699901161457 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_external_id" ON "user" ("externalId")
        `)

        log.info('AddPlatformIdToUser1699901161457 down')
    }
}
