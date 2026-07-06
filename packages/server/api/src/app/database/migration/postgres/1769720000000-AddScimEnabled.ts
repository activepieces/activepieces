import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddScimEnabled1769720000000 implements MigrationInterface {
    name = 'AddScimEnabled1769720000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "scimEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "scimEnabled" = false
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "scimEnabled" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "scimEnabled"
        `)
    }
}
