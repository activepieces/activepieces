import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'
import { ApEdition } from '@activepieces/shared'

export class AddReferral1690459469381 implements MigrationInterface {
    name = 'AddReferral1690459469381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(
            'CREATE TABLE "referal" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "referredUserId" character varying(21) NOT NULL, "referringUserId" character varying(21) NOT NULL, CONSTRAINT "PK_567787298ed6c13527df7887096" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_referral_referring_user_id" ON "referal" ("referredUserId", "referringUserId") ',
        )
        await queryRunner.query(
            'ALTER TABLE "referal" ADD CONSTRAINT "fk_referral_referred_user_id" FOREIGN KEY ("referredUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "referal" ADD CONSTRAINT "fk_referral_referring_user_id" FOREIGN KEY ("referringUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "referal" DROP CONSTRAINT "fk_referral_referring_user_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "referal" DROP CONSTRAINT "fk_referral_referred_user_id"',
        )
        await queryRunner.query(
            'DROP INDEX "public"."idx_referral_referring_user_id"',
        )
        await queryRunner.query('DROP TABLE "referal"')
    }
}
