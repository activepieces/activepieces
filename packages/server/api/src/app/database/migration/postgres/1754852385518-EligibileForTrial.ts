import { MigrationInterface, QueryRunner } from 'typeorm'

export class EligibileForTrial1754852385518 implements MigrationInterface {
    name = 'EligibileForTrial1754852385518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            RENAME COLUMN "eligibleForTrial" TO "eligibleForPlusTrial"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "eligibleForBusinessTrial" boolean NOT NULL DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            DROP COLUMN "eligibleForBusinessTrial"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            RENAME COLUMN "eligibleForPlusTrial" TO "eligibleForTrial"
        `)
    }
}

