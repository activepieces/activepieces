import { MigrationInterface, QueryRunner } from 'typeorm'

export class EligibileForTrial1754852385518 implements MigrationInterface {
    name = 'EligibileForTrial1754852385518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            DROP COLUMN "eligibleForTrial"
        `)

        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "eligibleForTrial" varchar
        `)

        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "eligibleForTrial" = NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            DROP COLUMN "eligibleForTrial"
        `)

        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "eligibleForTrial" boolean
        `)

        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "eligibleForTrial" = false
        `)
    }
}
