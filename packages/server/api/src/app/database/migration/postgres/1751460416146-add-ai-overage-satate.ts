import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiOverageState1751460416146 implements MigrationInterface {
    name = 'AddAiOverageState1751460416146'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
                RENAME COLUMN "aiCreditsOverageEnabled" TO "aiCreditsOverageState"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageState"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."platform_plan_aicreditsoveragestate_enum" AS ENUM(
                'not_allowed',
                'allowed_but_off',
                'allowed_and_on'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageState" "public"."platform_plan_aicreditsoveragestate_enum"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageState"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."platform_plan_aicreditsoveragestate_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageState" boolean
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
                RENAME COLUMN "aiCreditsOverageState" TO "aiCreditsOverageEnabled"
        `);
    }

}
