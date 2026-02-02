import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSecretManagersEntity1770045419675 implements MigrationInterface {
    name = 'AddSecretManagersEntity1770045419675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "secret_manager" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "providerId" character varying NOT NULL,
                "auth" jsonb,
                CONSTRAINT "PK_secret_manager" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_secret_manager_platform_id" ON "secret_manager" ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "secret_manager"
            ADD CONSTRAINT "fk_secret_manager_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "secret_manager" DROP CONSTRAINT "fk_secret_manager_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_secret_manager_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "secret_manager"
        `)
    }
}
