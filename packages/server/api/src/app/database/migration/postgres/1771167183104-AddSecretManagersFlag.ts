import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSecretManagersFlag1771167183104 implements MigrationInterface {
    name = 'AddSecretManagersFlag1771167183104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "secretManagersEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "secretManagersEnabled" = false
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "secretManagersEnabled" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "secretManagersEnabled"
        `)
    }

}
