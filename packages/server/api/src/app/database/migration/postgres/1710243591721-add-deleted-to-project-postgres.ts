import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddDeletedToProjectPostgres1710243591721 implements MigrationInterface {
    name = 'AddDeletedToProjectPostgres1710243591721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "deleted" TIMESTAMP WITH TIME ZONE
        `)

        log.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "deleted"
        `)

        log.info({ name: this.name }, 'down')
    }

}
