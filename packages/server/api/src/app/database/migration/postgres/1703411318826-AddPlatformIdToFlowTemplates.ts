import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class AddPlatformIdToFlowTemplates1703411318826
implements MigrationInterface {
    name = 'AddPlatformIdToFlowTemplates1703411318826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "userId"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "imageUrl"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "isFeatured"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "featuredDescription"
        `)

        await queryRunner.query(`
            ALTER TABLE "flow_template" ADD "type" character varying
        `)
        await queryRunner.query(`
            UPDATE "flow_template" SET "type" = 'PROJECT'
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" ALTER COLUMN "type" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "flow_template" ADD "platformId" character varying
        `)
        await queryRunner.query(`
            UPDATE "flow_template" SET "platformId" = (
                SELECT "platformId" FROM "project" WHERE project.id = flow_template."projectId"
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" ALTER COLUMN "platformId" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD CONSTRAINT "fk_flow_template_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP COLUMN "type"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD "featuredDescription" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD "isFeatured" boolean
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD "imageUrl" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD "userId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template"
            ADD CONSTRAINT "fk_flow_template_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }
}
