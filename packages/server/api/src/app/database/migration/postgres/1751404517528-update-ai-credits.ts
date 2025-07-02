import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateAiCredits1751404517528 implements MigrationInterface {
    name = 'UpdateAiCredits1751404517528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "includedAiCredits"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageLimit" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageEnabled" boolean
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "aiCreditsLimit"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "aiCreditsLimit" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "includedAiCredits" integer NOT NULL
        `)
    }

}
