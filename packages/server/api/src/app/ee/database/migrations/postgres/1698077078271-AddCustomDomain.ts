import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'

export class AddCustomDomain1698077078271 implements MigrationInterface {
    name = 'AddCustomDomain1698077078271'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            CREATE TABLE "custom_domain" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "domain" character varying NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "status" character varying NOT NULL,
                CONSTRAINT "PK_76b2cc5a1514eeffc66184c922a" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "custom_domain_domain_unique" ON "custom_domain" ("domain")
        `)
        await queryRunner.query(`
            ALTER TABLE "custom_domain"
            ADD CONSTRAINT "fk_custom_domain_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "custom_domain" DROP CONSTRAINT "fk_custom_domain_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "custom_domain_domain_unique"
        `)
        await queryRunner.query(`
            DROP TABLE "custom_domain"
        `)
    }
}
