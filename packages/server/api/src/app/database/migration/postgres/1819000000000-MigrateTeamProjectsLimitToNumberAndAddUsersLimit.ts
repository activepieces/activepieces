import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class MigrateTeamProjectsLimitToNumberAndAddUsersLimit1819000000000 implements Migration {
    name = 'MigrateTeamProjectsLimitToNumberAndAddUsersLimit1819000000000'
    breaking = false
    release = '0.85.4'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ADD COLUMN IF NOT EXISTS "usersLimit" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ALTER COLUMN "teamProjectsLimit" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "teamProjectsLimit" TYPE integer
            USING (
                CASE "teamProjectsLimit"
                    WHEN 'NONE' THEN 0
                    WHEN 'ONE' THEN 1
                    WHEN 'UNLIMITED' THEN NULL
                    ELSE NULL
                END
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "teamProjectsLimit" TYPE character varying
            USING (
                CASE
                    WHEN "teamProjectsLimit" = 0 THEN 'NONE'
                    WHEN "teamProjectsLimit" = 1 THEN 'ONE'
                    ELSE 'UNLIMITED'
                END
            )
        `)
        await queryRunner.query(`
            UPDATE "platform_plan" SET "teamProjectsLimit" = 'UNLIMITED' WHERE "teamProjectsLimit" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ALTER COLUMN "teamProjectsLimit" SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "usersLimit"
        `)
    }
}
