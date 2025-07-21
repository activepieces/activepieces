import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAiOverageState1751466404493 implements MigrationInterface {
    name = 'AddAiOverageState1751466404493'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
                RENAME COLUMN "aiCreditsOverageEnabled" TO "aiCreditsOverageState"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageState"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageState" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageState"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageState" boolean
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
                RENAME COLUMN "aiCreditsOverageState" TO "aiCreditsOverageEnabled"
        `)
    }

}
