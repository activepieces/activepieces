import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class AddSlugToGitRepo1709151540095 implements MigrationInterface {
    name = 'AddSlugToGitRepo1709151540095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "git_repo"
            ADD "slug" character varying
        `)

        await queryRunner.query(`
            UPDATE "git_repo"
            SET "slug" = "projectId"
        `)

        await queryRunner.query(`
            ALTER TABLE "git_repo"
            ALTER COLUMN "slug" SET NOT NULL
        `)

        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "git_repo" DROP COLUMN "slug"
        `)

        logger.info({ name: this.name }, 'down')
    }

}
