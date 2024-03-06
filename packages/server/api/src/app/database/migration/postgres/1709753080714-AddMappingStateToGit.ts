import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMappingStateToGit1709753080714 implements MigrationInterface {
    name = 'AddMappingStateToGit1709753080714'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "git_repo"
            ADD "mapping" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "git_repo" DROP COLUMN "mapping"
        `)
    }

}
