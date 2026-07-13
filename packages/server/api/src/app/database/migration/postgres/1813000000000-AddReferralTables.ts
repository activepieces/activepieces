import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddReferralTables1813000000000 implements Migration {
    name = 'AddReferralTables1813000000000'
    breaking = false
    release = '0.85.5'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "referral_phrase" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "displayPhrase" text NOT NULL,
                "normalizedPhrase" text NOT NULL,
                "phraseHash" character varying NOT NULL,
                "status" character varying NOT NULL,
                CONSTRAINT "PK_referral_phrase" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query('CREATE UNIQUE INDEX "idx_referral_phrase_user_id" ON "referral_phrase" ("userId")')
        await queryRunner.query('CREATE UNIQUE INDEX "idx_referral_phrase_normalized" ON "referral_phrase" ("normalizedPhrase")')
        await queryRunner.query('CREATE INDEX "idx_referral_phrase_hash" ON "referral_phrase" ("phraseHash")')

        await queryRunner.query(`
            CREATE TABLE "referral_redemption" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "referralPhraseId" character varying(21) NOT NULL,
                "inviterPlatformId" character varying(21) NOT NULL,
                "redeemerPlatformId" character varying(21) NOT NULL,
                "redeemerUserId" character varying(21) NOT NULL,
                "status" character varying NOT NULL,
                "inviterGrantUsd" integer NOT NULL,
                "redeemerGrantUsd" integer NOT NULL,
                CONSTRAINT "PK_referral_redemption" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query('CREATE UNIQUE INDEX "idx_referral_redemption_redeemer_platform" ON "referral_redemption" ("redeemerPlatformId")')
        await queryRunner.query('CREATE INDEX "idx_referral_redemption_inviter_platform" ON "referral_redemption" ("inviterPlatformId")')
        await queryRunner.query('CREATE INDEX "idx_referral_redemption_phrase_id" ON "referral_redemption" ("referralPhraseId")')

        await queryRunner.query(`
            ALTER TABLE "referral_phrase"
            ADD CONSTRAINT "fk_referral_phrase_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "referral_phrase"
            ADD CONSTRAINT "fk_referral_phrase_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "referral_redemption"
            ADD CONSTRAINT "fk_referral_redemption_phrase_id" FOREIGN KEY ("referralPhraseId") REFERENCES "referral_phrase"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "referral_redemption"')
        await queryRunner.query('DROP TABLE IF EXISTS "referral_phrase"')
    }
}
