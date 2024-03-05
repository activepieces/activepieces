import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from 'server-shared'

export class AddGeneratedByEmailToSigningKeyPostgres1709638978925 implements MigrationInterface {
    name = 'AddGeneratedByEmailToSigningKeyPostgres1709638978925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ADD "generatedByEmail" character varying(500)
        `)
        await queryRunner.query(`
            UPDATE "signing_key"
            SET "generatedByEmail" = "user"."email"
            FROM "user"
            WHERE "signing_key"."generatedBy" = "user"."id"
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ALTER COLUMN "generatedByEmail" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "signing_key" DROP CONSTRAINT "fk_signing_key_generated_by"
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ALTER COLUMN "generatedBy" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ADD CONSTRAINT "fk_signing_key_generated_by" FOREIGN KEY ("generatedBy") REFERENCES "user"("id")
            ON DELETE SET NULL ON UPDATE RESTRICT
        `)

        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "signing_key" DROP CONSTRAINT "fk_signing_key_generated_by"
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ALTER COLUMN "generatedBy"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ADD CONSTRAINT "fk_signing_key_generated_by" FOREIGN KEY ("generatedBy") REFERENCES "user"("id")
            ON DELETE RESTRICT ON UPDATE RESTRICT
        `)

        await queryRunner.query(`
            ALTER TABLE "signing_key" DROP COLUMN "generatedByEmail"
        `)

        logger.info({ name: this.name }, 'down')
    }
}
