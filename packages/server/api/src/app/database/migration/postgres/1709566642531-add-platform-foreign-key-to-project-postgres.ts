import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { isNotOneOfTheseEditions } from '../../database-common'

const log = system.globalLogger()

export class AddPlatformForeignKeyToProjectPostgres1709566642531 implements MigrationInterface {
    name = 'AddPlatformForeignKeyToProjectPostgres1709566642531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id")
            ON DELETE RESTRICT ON UPDATE RESTRICT
        `)

        log.info('[addPlatformForeignKeyToProjectPostgres1709566642531#up]')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `)

        log.info('[addPlatformForeignKeyToProjectPostgres1709566642531#down]')
    }

}
