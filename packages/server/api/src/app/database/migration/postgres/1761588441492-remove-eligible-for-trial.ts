import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveEligibleForTrial1761588441492 implements MigrationInterface {
    name = 'RemoveEligibleForTrial1761588441492'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "eligibleForTrial"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "eligibleForTrial" character varying
        `)
    }

}
