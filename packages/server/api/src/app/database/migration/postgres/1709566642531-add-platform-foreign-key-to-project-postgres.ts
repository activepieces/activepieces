import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from 'server-shared'

export class AddPlatformForeignKeyToProjectPostgres1709566642531 implements MigrationInterface {
    name = 'AddPlatformForeignKeyToProjectPostgres1709566642531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id")
            ON DELETE RESTRICT ON UPDATE RESTRICT
        `)

        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `)

        logger.info({ name: this.name }, 'down')
    }

}
