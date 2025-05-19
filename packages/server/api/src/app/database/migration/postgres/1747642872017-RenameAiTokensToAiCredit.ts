import { MigrationInterface, QueryRunner } from 'typeorm'

export class RenameAiTokensToAiCredit1747642872017 implements MigrationInterface {
    name = 'Migration1747642872017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
                RENAME COLUMN "aiTokens" TO "aiCredit"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
                RENAME COLUMN "aiCredit" TO "aiTokens"
        `)
    }

}
