import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddUserAttribution1842000000000 implements Migration {
    name = 'AddUserAttribution1842000000000'
    breaking = false
    release = '0.91.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user_attribution" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" character varying(21),
                "platformId" character varying(21),
                "identityId" character varying(21),
                "method" character varying NOT NULL,
                "sessionId" character varying,
                "utmSource" character varying,
                "utmMedium" character varying,
                "utmCampaign" character varying,
                "utmTerm" character varying,
                "utmContent" character varying,
                "gclid" character varying,
                "fbclid" character varying,
                "ref" character varying,
                "apCta" character varying,
                "landingPath" character varying,
                "referrer" character varying,
                CONSTRAINT "pk_user_attribution" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_attribution_user_id" ON "user_attribution" ("userId")
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_user_attribution_identity_id" ON "user_attribution" ("identityId")
        `)

        await queryRunner.query(`
            ALTER TABLE "user_attribution"
            ADD CONSTRAINT "fk_user_attribution_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "user_attribution" CASCADE')
    }
}
