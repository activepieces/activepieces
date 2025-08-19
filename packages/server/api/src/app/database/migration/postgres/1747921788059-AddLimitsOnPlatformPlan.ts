import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLimitsOnPlatformPlan1747921788059 implements MigrationInterface {
    name = 'AddLimitsOnPlatformPlan1747921788059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
                RENAME COLUMN "aiTokens" TO "aiCredits"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "userSeatsLimit" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "projectsLimit" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "tablesLimit" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "mcpLimit" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "activeFlowsLimit" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "activeFlowsLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "mcpLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "tablesLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "projectsLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "userSeatsLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
                RENAME COLUMN "aiCredits" TO "aiTokens"
        `)
    }

}
