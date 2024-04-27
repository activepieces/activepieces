import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class MakePlatformNotNullable1705969874745 implements MigrationInterface {
    name = 'MakePlatformNotNullable1705969874745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "type"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ALTER COLUMN "platformId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ALTER COLUMN "platformId" DROP NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "type" character varying NOT NULL DEFAULT 'STANDALONE'
        `)
    }

}