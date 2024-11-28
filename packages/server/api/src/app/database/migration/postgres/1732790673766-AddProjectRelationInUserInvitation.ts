import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProjectRelationInUserInvitation1732790412900 implements MigrationInterface {
    name = 'AddProjectRelationInUserInvitation1732790412900'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'up')
        // Delete user invitations with invalid project IDs
        await queryRunner.query(`
            DELETE FROM "user_invitation" 
            WHERE "projectId" IS NOT NULL 
            AND "projectId" NOT IN (SELECT "id" FROM "project")
        `)

        await queryRunner.query(`
            ALTER TABLE "user_invitation"
            ADD CONSTRAINT "fk_user_invitation_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        const projectMemberExists = await queryRunner.hasTable('project_member')
        if (projectMemberExists) {
            await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_role_id"
        `)
            await queryRunner.query(`
            ALTER TABLE "project_member" ALTER COLUMN "projectRoleId" TYPE character varying(21)
        `)
            await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD CONSTRAINT "fk_project_member_project_role_id" FOREIGN KEY ("projectRoleId") REFERENCES "project_role"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'down')
        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP CONSTRAINT "fk_user_invitation_project_id"
        `)
        const projectMemberExists = await queryRunner.hasTable('project_member')
        if (projectMemberExists) {
            await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_role_id"
        `)
            await queryRunner.query(`
            ALTER TABLE "project_member" ALTER COLUMN "projectRoleId" TYPE character varying
        `)
            await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD CONSTRAINT "fk_project_member_project_role_id" FOREIGN KEY ("projectRoleId") REFERENCES "project_role"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        }
    }

}
