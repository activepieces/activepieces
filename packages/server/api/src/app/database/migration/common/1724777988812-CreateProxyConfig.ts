import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProxyConfig1724777988812 implements MigrationInterface {
    name = 'CreateProxyConfig1724777988812'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "proxy_config" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "defaultHeaders" json NOT NULL,
                "baseUrl" character varying NOT NULL,
                "provider" character varying NOT NULL,
                CONSTRAINT "REL_6a003c802bd3daf2ae4fd7a16a" UNIQUE ("platformId", "provider"),
                CONSTRAINT "PK_2ecf3b46f1e0c88c1e336e74b4e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "proxy_config"
            ADD CONSTRAINT "fk_proxy_config_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "proxy_config" DROP CONSTRAINT "fk_proxy_config_platform_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_proxy_config_platform_id_provider"
        `);
        await queryRunner.query(`
            DROP TABLE "proxy_config"
        `);
    }

}
