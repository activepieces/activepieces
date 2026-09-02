import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPlatformConfiguration1840000000000 implements Migration {
    name = 'AddPlatformConfiguration1840000000000'
    breaking = false
    release = '0.88.4'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "platform_configuration" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "isProductTelemetryEnabled" boolean NOT NULL DEFAULT true,
                "isInfraSetupTelemetryEnabled" boolean NOT NULL DEFAULT true,
                CONSTRAINT "pk_platform_configuration" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_configuration_platform_id" ON "platform_configuration" ("platformId")
        `)

        await queryRunner.query(`
            ALTER TABLE "platform_configuration"
            ADD CONSTRAINT "fk_platform_configuration_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "platform_configuration" CASCADE')
    }
}
