import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddPlatformToProject1698065083750 implements MigrationInterface {
    name = 'AddPlatformToProject1698065083750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "type" character varying NOT NULL DEFAULT 'STANDALONE'
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "platformId" character varying(21)
        `)

        log.info('AddPlatformToProject1698065083750 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "type"
        `)

        log.info('AddPlatformToProject1698065083750 down')
    }
}
