import { logger } from '@activepieces/server-shared'
import { RoleType } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

enum ProjectMemberRole {
    ADMIN = 'ADMIN',
    EDITOR = 'EDITOR',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER',
}

enum Permission {
    READ_APP_CONNECTION = 'READ_APP_CONNECTION',
    WRITE_APP_CONNECTION = 'WRITE_APP_CONNECTION',
    READ_FLOW = 'READ_FLOW',
    WRITE_FLOW = 'WRITE_FLOW',
    UPDATE_FLOW_STATUS = 'UPDATE_FLOW_STATUS',
    WRITE_INVITATION = 'WRITE_INVITATION',
    READ_INVITATION = 'READ_INVITATION',
    READ_PROJECT_MEMBER = 'READ_PROJECT_MEMBER',
    WRITE_PROJECT_MEMBER = 'WRITE_PROJECT_MEMBER',
    WRITE_GIT_REPO = 'WRITE_GIT_REPO',
    READ_GIT_REPO = 'READ_GIT_REPO',
    READ_RUN = 'READ_RUN',
    WRITE_RUN = 'WRITE_RUN',
    READ_ISSUES = 'READ_ISSUES',
    WRITE_ISSUES = 'WRITE_ISSUES',
    READ_FOLDER = 'READ_FOLDER',
    WRITE_FOLDER = 'WRITE_FOLDER',
    WRITE_ALERT = 'WRITE_ALERT',
    READ_ALERT = 'READ_ALERT',
    WRITE_PROJECT = 'WRITE_PROJECT',
}


const rolePermissions: Record<ProjectMemberRole, Permission[]> = {
    [ProjectMemberRole.ADMIN]: [
        Permission.READ_APP_CONNECTION,
        Permission.WRITE_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.WRITE_FLOW,
        Permission.UPDATE_FLOW_STATUS,
        Permission.READ_PROJECT_MEMBER,
        Permission.WRITE_PROJECT_MEMBER,
        Permission.WRITE_INVITATION,
        Permission.READ_INVITATION,
        Permission.WRITE_GIT_REPO,
        Permission.READ_GIT_REPO,
        Permission.READ_RUN,
        Permission.WRITE_RUN,
        Permission.READ_ISSUES,
        Permission.WRITE_ISSUES,
        Permission.WRITE_ALERT,
        Permission.READ_ALERT,
        Permission.WRITE_PROJECT,
    ],
    [ProjectMemberRole.EDITOR]: [
        Permission.READ_APP_CONNECTION,
        Permission.WRITE_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.WRITE_FLOW,
        Permission.UPDATE_FLOW_STATUS,
        Permission.READ_PROJECT_MEMBER,
        Permission.READ_INVITATION,
        Permission.WRITE_GIT_REPO,
        Permission.READ_GIT_REPO,
        Permission.READ_RUN,
        Permission.WRITE_RUN,
        Permission.READ_ISSUES,
        Permission.WRITE_ISSUES,
    ],
    [ProjectMemberRole.OPERATOR]: [
        Permission.READ_APP_CONNECTION,
        Permission.WRITE_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.UPDATE_FLOW_STATUS,
        Permission.READ_PROJECT_MEMBER,
        Permission.READ_INVITATION,
        Permission.READ_GIT_REPO,
        Permission.READ_RUN,
        Permission.WRITE_RUN,
        Permission.READ_ISSUES,
    ],
    [ProjectMemberRole.VIEWER]: [
        Permission.READ_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.READ_PROJECT_MEMBER,
        Permission.READ_INVITATION,
        Permission.READ_ISSUES,
    ],
}


export class CreateProjectRoleTable1731424289830 implements MigrationInterface {
    name = 'CreateProjectRoleTable1731424289830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'Creating project role table')
        await queryRunner.query(`
            CREATE TABLE "project_role" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "permissions" character varying array NOT NULL,
                "platformId" character varying,
                "type" character varying NOT NULL,
                CONSTRAINT "PK_3c677495ab48997b2dc02048289" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(
            'INSERT INTO "project_role" ("id", "name", "permissions", "platformId", "type") VALUES ($1, $2, $3, $4, $5)',
            ['aJVBSSJ3YqZ7r1laFjM0a', ProjectMemberRole.VIEWER, rolePermissions[ProjectMemberRole.VIEWER], null, RoleType.DEFAULT],
        )

        await queryRunner.query(
            'INSERT INTO "project_role" ("id", "name", "permissions", "platformId", "type") VALUES ($1, $2, $3, $4, $5)',
            ['sjWe85TwaFYxyhn2AgOha', ProjectMemberRole.EDITOR, rolePermissions[ProjectMemberRole.EDITOR], null, RoleType.DEFAULT],
        )

        await queryRunner.query(
            'INSERT INTO "project_role" ("id", "name", "permissions", "platformId", "type") VALUES ($1, $2, $3, $4, $5)',
            ['461ueYHzMykyk5dIL8HzQ', ProjectMemberRole.ADMIN, rolePermissions[ProjectMemberRole.ADMIN], null, RoleType.DEFAULT],
        )

        await queryRunner.query(
            'INSERT INTO "project_role" ("id", "name", "permissions", "platformId", "type") VALUES ($1, $2, $3, $4, $5)',
            ['3Wl9IAw5aM0HLafHgMYkb', ProjectMemberRole.OPERATOR, rolePermissions[ProjectMemberRole.OPERATOR], null, RoleType.DEFAULT],
        )

        const projectMemberExists = await queryRunner.hasTable('project_member')

        if (projectMemberExists) {
            await queryRunner.query(`
                ALTER TABLE "project_member" ADD COLUMN "projectRoleId" character varying
        `)

            await queryRunner.query(`
            ALTER TABLE "project_member" 
            ADD CONSTRAINT "fk_project_member_project_role_id" 
            FOREIGN KEY ("projectRoleId") REFERENCES "project_role"("id") ON DELETE CASCADE
        `)

            const projectMembers = await queryRunner.query(`
            SELECT id, role FROM project_member
        `)

            for (const projectMember of projectMembers) {
                const projectRoleIdResult = await queryRunner.query(
                    'SELECT id FROM project_role WHERE name = $1',
                    [projectMember.role],
                )

                const projectRoleId = projectRoleIdResult[0]?.id

                await queryRunner.query(
                    'UPDATE "project_member" SET "projectRoleId" = $1 WHERE id = $2',
                    [projectRoleId, projectMember.id],
                )
            }

            await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "role"
        `)

            await queryRunner.query(`
            ALTER TABLE "project_member" ALTER COLUMN "projectRoleId" SET NOT NULL
        `)
        }
        await queryRunner.query(`
            ALTER TABLE "user_invitation" ADD COLUMN "projectRoleId" character varying
        `)

        await queryRunner.query(`
            ALTER TABLE "user_invitation" 
            ADD CONSTRAINT "fk_user_invitation_project_role_id" 
            FOREIGN KEY ("projectRoleId") REFERENCES "project_role"("id") ON DELETE CASCADE
        `)

        const userInvitations = await queryRunner.query(`
            SELECT id, "projectRole" FROM user_invitation where "projectRole" is not null
        `)

        for (const userInvitation of userInvitations) {
            const projectRoleIdResult = await queryRunner.query(
                'SELECT id FROM project_role WHERE name = $1',
                [userInvitation.projectRole],
            )

            const projectRoleId = projectRoleIdResult[0]?.id

            await queryRunner.query(
                'UPDATE "user_invitation" SET "projectRoleId" = $1 WHERE id = $2',
                [projectRoleId, userInvitation.id],
            )
        }

        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP COLUMN "projectRole"
        `)

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'down')
        // Re-add the "projectRole" column to "user_invitation"
        await queryRunner.query(`
            ALTER TABLE "user_invitation" ADD COLUMN "projectRole" character varying
        `)

        // Restore "projectRole" values from "projectRoleId"
        const userInvitations = await queryRunner.query(`
            SELECT id, "projectRoleId" FROM user_invitation
        `)

        for (const userInvitation of userInvitations) {
            const projectRoleNameResult = await queryRunner.query(
                'SELECT name FROM project_role WHERE id = $1',
                [userInvitation.projectRoleId],
            )

            const projectRoleName = projectRoleNameResult[0]?.name

            await queryRunner.query(
                'UPDATE "user_invitation" SET "projectRole" = $1 WHERE id = $2',
                [projectRoleName, userInvitation.id],
            )
        }

        // Drop the foreign key and column "projectRoleId" from "user_invitation"
        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP CONSTRAINT "fk_user_invitation_project_role_id"
        `)

        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP COLUMN "projectRoleId"
        `)
        const projectMemberExists = await queryRunner.hasTable('project_member')

        if (projectMemberExists) {
            // Re-add the "role" column to "project_member"
            await queryRunner.query(`
            ALTER TABLE "project_member" ADD COLUMN "role" character varying
        `)

            // Restore "role" values from "projectRoleId"
            const projectMembers = await queryRunner.query(`
            SELECT id, "projectRoleId" FROM project_member
        `)

            for (const projectMember of projectMembers) {
                const projectRoleNameResult = await queryRunner.query(
                    'SELECT name FROM project_role WHERE id = $1',
                    [projectMember.projectRoleId],
                )

                const projectRoleName = projectRoleNameResult[0]?.name

                await queryRunner.query(
                    'UPDATE "project_member" SET "role" = $1 WHERE id = $2',
                    [projectRoleName, projectMember.id],
                )
            }

            // Drop the foreign key and column "projectRoleId" from "project_member"
            await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_role_id"
        `)

            await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "projectRoleId"
        `)
        }

        // Drop the "project_role" table
        await queryRunner.query(`
            DROP TABLE "project_role"
        `)
    }

}
