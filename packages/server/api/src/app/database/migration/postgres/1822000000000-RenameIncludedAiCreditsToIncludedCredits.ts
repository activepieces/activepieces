import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class RenameIncludedAiCreditsToIncludedCredits1822000000000 implements Migration {
    name = 'RenameIncludedAiCreditsToIncludedCredits1822000000000'
    breaking = true
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" RENAME COLUMN "includedAiCredits" TO "includedCredits"')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" RENAME COLUMN "includedCredits" TO "includedAiCredits"')
    }
}
