import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class AddProjectIdToTemplate1688083336934 implements MigrationInterface {
    name = 'AddProjectIdToTemplate1688083336934'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        logger.info('Running migration AddProjectIdToTemplate1688083336934')
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "projectId" character varying',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        logger.info('Finished migration AddProjectIdToTemplate1688083336934')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "projectId"',
        )
    }
}
