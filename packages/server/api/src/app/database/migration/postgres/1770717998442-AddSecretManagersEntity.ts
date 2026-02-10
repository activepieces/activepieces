import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSecretManagersEntity1770717998442 implements MigrationInterface {
    name = 'AddSecretManagersEntity1770717998442'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "secret_manager" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "providerId" character varying NOT NULL,
                "auth" jsonb,
                CONSTRAINT "idx_secret_manager_platform_id_provider_id" UNIQUE ("platformId", "providerId"),
                CONSTRAINT "PK_0ae8f80f081a7b8889212816aac" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_secret_manager_platform_id" ON "secret_manager" ("platformId")
        `);
        await queryRunner.query(`
            ALTER TABLE "secret_manager"
            ADD CONSTRAINT "fk_secret_manager_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "secret_manager" DROP CONSTRAINT "fk_secret_manager_platform_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_secret_manager_platform_id"
        `);
        await queryRunner.query(`
            DROP TABLE "secret_manager"
        `);
    }

}
