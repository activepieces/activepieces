import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlanNameOnPlatformPlan1748549003744 implements MigrationInterface {
    name = 'AddPlanNameOnPlatformPlan1748549003744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "plan" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "plan"
        `)
    }

}
