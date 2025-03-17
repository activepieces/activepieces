import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOauthApp1741683756436 implements MigrationInterface {
    name = 'AddOauthApp1741683756436'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_oauth_app_platform_id_piece_name" ON "oauth_app" ("platformId", "pieceName")
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_app"
            ADD CONSTRAINT "fk_oauth_app_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "oauth_app" DROP CONSTRAINT "fk_oauth_app_platform_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_oauth_app_platform_id_piece_name"
        `);
        await queryRunner.query(`
            DROP TABLE "oauth_app"
        `);
    }

}
