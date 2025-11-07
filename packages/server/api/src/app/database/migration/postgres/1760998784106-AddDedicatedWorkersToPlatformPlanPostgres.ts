import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDedicatedWorkersToPlatformPlanPostgres1760998784106 implements MigrationInterface {
    name = 'AddDedicatedWorkersToPlatformPlanPostgres1760998784106'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "dedicatedWorkers" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "dedicatedWorkers"
        `)
    }

}
