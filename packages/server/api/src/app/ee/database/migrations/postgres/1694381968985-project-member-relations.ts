import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class ProjectMemberRelations1694381968985 implements MigrationInterface {
    name = 'ProjectMemberRelations1694381968985'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_member" ADD CONSTRAINT "fk_project_member_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "project_member" ADD CONSTRAINT "fk_project_member_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )

        logger.info('ProjectMemberRelations1694381968985 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_user_id"',
        )

        logger.info('ProjectMemberRelations1694381968985 down')
    }
}
