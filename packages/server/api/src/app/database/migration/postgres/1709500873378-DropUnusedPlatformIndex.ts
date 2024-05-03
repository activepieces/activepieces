import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class DropUnusedPlatformIndex1709500873378 implements MigrationInterface {
    name = 'DropUnusedPlatformIndex1709500873378'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

}
