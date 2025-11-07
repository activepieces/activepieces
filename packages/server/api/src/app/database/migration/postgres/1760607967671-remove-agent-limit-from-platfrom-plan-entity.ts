import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveAgentLimitFromPlatfromPlanEntity1760607967671 implements MigrationInterface {
    name = 'RemoveAgentLimitFromPlatfromPlanEntity1760607967671'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "agentsLimit"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "agentsLimit" integer
        `)
    }

}
