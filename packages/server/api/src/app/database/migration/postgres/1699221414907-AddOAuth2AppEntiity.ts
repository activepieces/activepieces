import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class AddOAuth2AppEntiity1699221414907 implements MigrationInterface {
    name = 'AddOAuth2AppEntiity1699221414907'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            CREATE TABLE "oauth_app" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "pieceName" character varying NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "clientId" character varying NOT NULL,
                "clientSecret" jsonb NOT NULL,
                CONSTRAINT "PK_3256b97c0a3ee2d67240805dca4" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_oauth_app_platformId_pieceName" ON "oauth_app" ("platformId", "pieceName")
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_app"
            ADD CONSTRAINT "fk_oauth_app_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "oauth_app" DROP CONSTRAINT "fk_oauth_app_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_oauth_app_platformId_pieceName"
        `)
        await queryRunner.query(`
            DROP TABLE "oauth_app"
        `)
    }
}
