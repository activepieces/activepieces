import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddSsoDomainToPlatformPlan1786500000000 implements Migration {
    name = 'AddSsoDomainToPlatformPlan1786500000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "ssoDomain" character varying
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_platform_plan_sso_domain"
            ON "platform_plan" ("ssoDomain")
            WHERE "ssoDomain" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_platform_plan_sso_domain"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "ssoDomain"')
    }
}
