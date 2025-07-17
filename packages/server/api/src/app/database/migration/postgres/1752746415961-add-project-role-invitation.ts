import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProjectRoleInvitation1752746415961 implements MigrationInterface {
    name = 'AddProjectRoleInvitation1752746415961'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_invitation"
            ADD "projectRoleId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "user_invitation"
            ADD CONSTRAINT "fk_user_invitation_project_role_id" FOREIGN KEY ("projectRoleId") REFERENCES "project_role"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP CONSTRAINT "fk_user_invitation_project_role_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP COLUMN "projectRoleId"
        `)
    }
}
