import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpsEnabled1751989232042 implements MigrationInterface {
    name = 'AddMcpsEnabled1751989232042'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "alertsEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "mcpsEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "mcpsEnabled" = true
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "mcpsEnabled"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "mcpsEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "alertsEnabled" boolean NOT NULL
        `)
    }

}
