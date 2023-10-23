import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../../helper/logger'

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
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)

        logger.info('AddPlatformToProject1698065083750 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "type"
        `)

        logger.info('AddPlatformToProject1698065083750 down')
    }

}
