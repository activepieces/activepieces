import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class AddBranchTypeToGit1711073772867 implements MigrationInterface {
    name = 'AddBranchTypeToGit1711073772867'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "git_repo"
            ADD COLUMN "branchType" character varying DEFAULT 'DEVELOPMENT';
        `)

        await queryRunner.query(`
            UPDATE "git_repo"
            SET "branchType" = 'DEVELOPMENT';
        `)

        await queryRunner.query(`
            ALTER TABLE "git_repo"
            ALTER COLUMN "branchType" SET NOT NULL;
        `)

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "git_repo" DROP COLUMN "branchType"
        `)
    }

}
