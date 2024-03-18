import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from 'server-shared'

export class AddDeletedToProjectPostgres1710243591721 implements MigrationInterface {
    name = 'AddDeletedToProjectPostgres1710243591721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "deleted" TIMESTAMP WITH TIME ZONE
        `)

        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "deleted"
        `)

        logger.info({ name: this.name }, 'down')
    }

}
