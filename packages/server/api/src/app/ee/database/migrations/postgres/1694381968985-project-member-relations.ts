import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from 'server-shared'

export class ProjectMemberRelations1694381968985 implements MigrationInterface {
    name = 'ProjectMemberRelations1694381968985'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "project_member" ADD CONSTRAINT "fk_project_member_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "project_member" ADD CONSTRAINT "fk_project_member_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )

        logger.info('ProjectMemberRelations1694381968985 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_user_id"',
        )

        logger.info('ProjectMemberRelations1694381968985 down')
    }
}
