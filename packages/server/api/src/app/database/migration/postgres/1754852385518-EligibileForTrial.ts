import { MigrationInterface, QueryRunner } from 'typeorm'

export class EligibileForTrial1754852385518 implements MigrationInterface {
    name = 'EligibileForTrial1754852385518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "eligibleForTrial" TYPE varchar,
            ALTER COLUMN "eligibleForTrial" SET DEFAULT NULL,
            ALTER COLUMN "eligibleForTrial" DROP NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "eligibleForTrial" TYPE boolean USING CASE 
                WHEN "eligibleForTrial" IS NULL THEN false
                WHEN "eligibleForTrial" IS NOT NULL THEN true
                ELSE false
            END,
            ALTER COLUMN "eligibleForTrial" SET DEFAULT false,
            ALTER COLUMN "eligibleForTrial" SET NOT NULL
        `)
    }
}