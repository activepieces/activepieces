import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from 'server-shared'

export class AddSlugToGitRepo1709151540095 implements MigrationInterface {
    name = 'AddSlugToGitRepo1709151540095'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
        await queryRunner.query(`
            ALTER TABLE "git_repo" DROP COLUMN "slug"
        `)

        logger.info({ name: this.name }, 'down')
    }

}
