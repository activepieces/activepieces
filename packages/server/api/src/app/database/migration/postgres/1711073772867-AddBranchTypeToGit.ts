import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBranchTypeToGit1711073772867 implements MigrationInterface {
    name = 'AddBranchTypeToGit1711073772867'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
        await queryRunner.query(`
            ALTER TABLE "git_repo" DROP COLUMN "branchType"
        `)
    }

}
