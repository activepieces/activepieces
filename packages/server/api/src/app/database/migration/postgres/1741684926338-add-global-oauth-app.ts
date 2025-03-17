import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGlobalOauthApp1741684926338 implements MigrationInterface {
    name = 'AddGlobalOauthApp1741684926338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "global_oauth_app" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "pieceName" character varying NOT NULL,
                "clientId" character varying NOT NULL,
                "clientSecret" character varying NOT NULL,
                CONSTRAINT "PK_7a51ebf4a59f1bbd06668fdb6a2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_global_oauth_app_piece_name" ON "global_oauth_app" ("pieceName")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_global_oauth_app_piece_name"
        `);
        await queryRunner.query(`
            DROP TABLE "global_oauth_app"
        `);
    }

}
