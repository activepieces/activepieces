import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddMultipleEmailDomainsEnabledToPlatformPlan1885000000000 implements Migration {
    name = 'AddMultipleEmailDomainsEnabledToPlatformPlan1885000000000'
    breaking = false
    release = '0.94.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ADD COLUMN "multipleEmailDomainsEnabled" boolean NOT NULL DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "multipleEmailDomainsEnabled"
        `)
    }
}
