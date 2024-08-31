import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProxyConfig1724777988812 implements MigrationInterface {
    name = 'CreateProxyConfig1724777988812'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "proxy_config" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "defaultHeaders" json NOT NULL,
                "baseUrl" character varying NOT NULL,
                "provider" character varying NOT NULL,
                "project_id" character varying(21),
                "platform_id" character varying(21) NOT NULL,
                CONSTRAINT "PK_2ecf3b46f1e0c88c1e336e74b4e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_proxy_config_platform_project_provider_unique" ON "proxy_config" ("platform_id", "project_id", "provider") WHERE project_id IS NOT NULL
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_proxy_config_platform_provider_unique" ON "proxy_config" ("platform_id", "provider") WHERE project_id IS NULL`)
        await queryRunner.query(`
            ALTER TABLE "proxy_config"
            ADD CONSTRAINT "fk_proxy_config_project_id" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "proxy_config"
            ADD CONSTRAINT "fk_proxy_config_platform_id" FOREIGN KEY ("platform_id") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "proxy_config" DROP CONSTRAINT "fk_proxy_config_platform_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "proxy_config" DROP CONSTRAINT "fk_proxy_config_project_id"
        `);
        await queryRunner.query(`DROP INDEX "public"."idx_proxy_config_platform_project_provider_unique"`)
        await queryRunner.query(`
            DROP TABLE "proxy_config"
        `);
    }

}
