import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class FlowTemplateAddUserIdAndImageUrl1694379223109
implements MigrationInterface {
    name = 'FlowTemplateAddUserIdAndImageUrl1694379223109'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "pinnedOrder"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "userId" character varying',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "imageUrl" character varying',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ALTER COLUMN "projectId" SET NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD CONSTRAINT "fk_flow_template_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )

        logger.info('FlowTemplateAddUserIdAndImageUrl1694379223109 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_user_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ALTER COLUMN "projectId" DROP NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "imageUrl"',
        )
        await queryRunner.query('ALTER TABLE "flow_template" DROP COLUMN "userId"')
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "pinnedOrder" integer',
        )

        logger.info('FlowTemplateAddUserIdAndImageUrl1694379223109 down')
    }
}
