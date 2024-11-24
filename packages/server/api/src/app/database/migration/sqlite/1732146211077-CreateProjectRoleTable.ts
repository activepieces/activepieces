import { apId, RoleType } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export enum ProjectMemberRole {
    ADMIN = 'ADMIN',
    EDITOR = 'EDITOR',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER',
}

export enum Permission {
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
    WRITE_EMAIL_ALERT = 'WRITE_EMAIL_ALERT',
    READ_EMAIL_ALERT = 'READ_EMAIL_ALERT',
    WRITE_PROJECT = 'WRITE_PROJECT',
    READ_PROJECT = 'READ_PROJECT',
    WRITE_INSTALL_PIECE = 'WRITE_INSTALL_PIECE',
    READ_INSTALL_PIECE = 'READ_INSTALL_PIECE',
}

export const rolePermissions: Record<ProjectMemberRole, Permission[]> = {
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
        Permission.WRITE_EMAIL_ALERT,
        Permission.READ_EMAIL_ALERT,
        Permission.WRITE_PROJECT,
        Permission.READ_PROJECT,
        Permission.WRITE_INSTALL_PIECE,
        Permission.READ_INSTALL_PIECE,
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
        Permission.WRITE_EMAIL_ALERT,
        Permission.READ_EMAIL_ALERT,
        Permission.READ_PROJECT,
        Permission.WRITE_INSTALL_PIECE,
        Permission.READ_INSTALL_PIECE,
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
        Permission.WRITE_EMAIL_ALERT,
        Permission.READ_EMAIL_ALERT,
        Permission.READ_PROJECT,
        Permission.READ_INSTALL_PIECE,
    ],
    [ProjectMemberRole.VIEWER]: [
        Permission.READ_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.READ_PROJECT_MEMBER,
        Permission.READ_INVITATION,
        Permission.READ_ISSUES,
        Permission.READ_EMAIL_ALERT,
        Permission.READ_PROJECT,
        Permission.READ_INSTALL_PIECE,
    ],
}

export class CreateProjectRoleTable1732146211077 implements MigrationInterface {
    name = 'CreateProjectRoleTable1732146211077'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "project_role" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "permissions" text NOT NULL,
                "platformId" varchar,
                "type" varchar NOT NULL
            )
        `)

        await queryRunner.query(
            'INSERT INTO "project_role" ("id", "name", "permissions", "platformId", "type") VALUES (?, ?, ?, ?, ?)',
            [apId(), ProjectMemberRole.VIEWER, JSON.stringify(rolePermissions[ProjectMemberRole.VIEWER]), null, RoleType.DEFAULT],
        )

        await queryRunner.query(
            'INSERT INTO "project_role" ("id", "name", "permissions", "platformId", "type") VALUES (?, ?, ?, ?, ?)',
            [apId(), ProjectMemberRole.EDITOR, JSON.stringify(rolePermissions[ProjectMemberRole.EDITOR]), null, RoleType.DEFAULT],
        )

        await queryRunner.query(
            'INSERT INTO "project_role" ("id", "name", "permissions", "platformId", "type") VALUES (?, ?, ?, ?, ?)',
            [apId(), ProjectMemberRole.ADMIN, JSON.stringify(rolePermissions[ProjectMemberRole.ADMIN]), null, RoleType.DEFAULT],
        )

        await queryRunner.query(
            'INSERT INTO "project_role" ("id", "name", "permissions", "platformId", "type") VALUES (?, ?, ?, ?, ?)',
            [apId(), ProjectMemberRole.OPERATOR, JSON.stringify(rolePermissions[ProjectMemberRole.OPERATOR]), null, RoleType.DEFAULT],
        )

        await queryRunner.query(`
            ALTER TABLE "project_member" ADD COLUMN "projectRoleId" varchar
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
                'SELECT id FROM project_role WHERE name = ?',
                [projectMember.role],
            )

            const projectRoleId = projectRoleIdResult[0]?.id

            await queryRunner.query(
                'UPDATE "project_member" SET "projectRoleId" = ? WHERE id = ?',
                [projectRoleId, projectMember.id],
            )
        }

        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "role"
        `)

        await queryRunner.query(`
            ALTER TABLE "user_invitation" ADD COLUMN "projectRoleId" varchar
        `)

        await queryRunner.query(`
            ALTER TABLE "user_invitation" 
            ADD CONSTRAINT "fk_user_invitation_project_role_id" 
            FOREIGN KEY ("projectRoleId") REFERENCES "project_role"("id") ON DELETE CASCADE
        `)

        const userInvitations = await queryRunner.query(`
            SELECT id, "projectRole" FROM user_invitation
        `)

        for (const userInvitation of userInvitations) {
            const projectRoleIdResult = await queryRunner.query(
                'SELECT id FROM project_role WHERE name = ?',
                [userInvitation.projectRole],
            )

            const projectRoleId = projectRoleIdResult[0]?.id

            await queryRunner.query(
                'UPDATE "user_invitation" SET "projectRoleId" = ? WHERE id = ?',
                [projectRoleId, userInvitation.id],
            )
        }

        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP COLUMN "projectRole"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_invitation" ADD COLUMN "projectRole" varchar
        `)

        const userInvitations = await queryRunner.query(`
            SELECT id, "projectRoleId" FROM user_invitation
        `)

        for (const userInvitation of userInvitations) {
            const projectRoleNameResult = await queryRunner.query(
                'SELECT name FROM project_role WHERE id = ?',
                [userInvitation.projectRoleId],
            )

            const projectRoleName = projectRoleNameResult[0]?.name

            await queryRunner.query(
                'UPDATE "user_invitation" SET "projectRole" = ? WHERE id = ?',
                [projectRoleName, userInvitation.id],
            )
        }

        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP CONSTRAINT "fk_user_invitation_project_role_id"
        `)

        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP COLUMN "projectRoleId"
        `)

        await queryRunner.query(`
            ALTER TABLE "project_member" ADD COLUMN "role" varchar
        `)

        const projectMembers = await queryRunner.query(`
            SELECT id, "projectRoleId" FROM project_member
        `)

        for (const projectMember of projectMembers) {
            const projectRoleNameResult = await queryRunner.query(
                'SELECT name FROM project_role WHERE id = ?',
                [projectMember.projectRoleId],
            )

            const projectRoleName = projectRoleNameResult[0]?.name

            await queryRunner.query(
                'UPDATE "project_member" SET "role" = ? WHERE id = ?',
                [projectRoleName, projectMember.id],
            )
        }

        await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_role_id"
        `)

        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "projectRoleId"
        `)

        await queryRunner.query(`
            DROP TABLE "project_role"
        `)
    }
}
