import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveUniqueEmailOnUser1713221809186 implements MigrationInterface {
    name = 'RemoveUniqueEmailOnUser1713221809186'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_partial_unique_email_platform_id_is_null"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_partial_unique_email_platform_id_is_null" ON "user" ("email")
            WHERE ("platformId" IS NULL)
        `)
    }

}
