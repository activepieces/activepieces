import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class AddUserEmailToReferral1709500213947 implements MigrationInterface {
    name = 'AddUserEmailToReferral1709500213947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "referal"
            ADD "referredUserEmail" character varying(500)
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ADD "referringUserEmail" character varying(500)
        `)
        await queryRunner.query(`
            UPDATE "referal"
            SET "referredUserEmail" = "user"."email"
            FROM "user"
            WHERE "referal"."referredUserId" = "user"."id"
        `)
        await queryRunner.query(`
            UPDATE "referal"
            SET "referringUserEmail" = "user"."email"
            FROM "user"
            WHERE "referal"."referringUserId" = "user"."id"
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ALTER COLUMN "referredUserEmail" SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ALTER COLUMN "referringUserEmail" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "referal" DROP CONSTRAINT "fk_referral_referred_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "referal" DROP CONSTRAINT "fk_referral_referring_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_referral_referring_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ALTER COLUMN "referredUserId" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ALTER COLUMN "referringUserId" DROP NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_referral_referring_user_id" ON "referal" ("referredUserId", "referringUserId")
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ADD CONSTRAINT "fk_referral_referred_user_id" FOREIGN KEY ("referredUserId") REFERENCES "user"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ADD CONSTRAINT "fk_referral_referring_user_id" FOREIGN KEY ("referringUserId") REFERENCES "user"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `)

        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "referal" DROP CONSTRAINT "fk_referral_referring_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "referal" DROP CONSTRAINT "fk_referral_referred_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_referral_referring_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ALTER COLUMN "referringUserId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ALTER COLUMN "referredUserId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_referral_referring_user_id" ON "referal" ("referredUserId", "referringUserId")
        `)
        await queryRunner.query(`
            ALTER TABLE "referal" DROP COLUMN "referringUserEmail"
        `)
        await queryRunner.query(`
            ALTER TABLE "referal" DROP COLUMN "referredUserEmail"
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ADD CONSTRAINT "fk_referral_referring_user_id" FOREIGN KEY ("referringUserId") REFERENCES "user"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "referal"
            ADD CONSTRAINT "fk_referral_referred_user_id" FOREIGN KEY ("referredUserId") REFERENCES "user"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        logger.info({ name: this.name }, 'down')
    }

}
