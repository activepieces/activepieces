import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class ManagedAuthnInitial1698700720482 implements MigrationInterface {
    name = 'ManagedAuthnInitial1698700720482'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "externalId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "externalId" character varying
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_external_id" ON "user" ("externalId")
        `)

        log.info('ManagedAuthnInitial1698700720482 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "externalId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "externalId"
        `)

        log.info('ManagedAuthnInitial1698700720482 down')
    }
}
