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
    WRITE_RPOJECT = 'WRITE_RPOJECT',
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
        Permission.WRITE_RPOJECT,
        Permission.WRITE_GIT_REPO,
        Permission.READ_GIT_REPO,
        Permission.READ_RUN,
        Permission.WRITE_RUN,
        Permission.READ_ISSUES,
        Permission.WRITE_ISSUES
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
        Permission.WRITE_ISSUES
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



export class CreateRbacTable1731424289830 implements MigrationInterface {
    name = 'CreateRbacTable1731424289830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "rbac" (
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
        
        const platformIds = await queryRunner.query(`SELECT id FROM platform`); 

        for (const platformId of platformIds) {
            await queryRunner.query(
                `INSERT INTO "rbac" ("id", "name", "permissions", "platformId", "type") VALUES ($1, $2, $3, $4, $5)`,
                [apId(), ProjectMemberRole.VIEWER, JSON.stringify(rolePermissions[ProjectMemberRole.VIEWER]), platformId, RoleType.DEFAULT]
            );

            await queryRunner.query(
                `INSERT INTO "rbac" ("id", "name", "permissions", "platformId", "type") VALUES ($1, $2, $3, $4, $5)`,
                [apId(), ProjectMemberRole.EDITOR, JSON.stringify(rolePermissions[ProjectMemberRole.EDITOR]), platformId, RoleType.DEFAULT]
            );

            await queryRunner.query(
                `INSERT INTO "rbac" ("id", "name", "permissions", "platformId", "type") VALUES ($1, $2, $3, $4, $5)`,
                [apId(), ProjectMemberRole.ADMIN, JSON.stringify(rolePermissions[ProjectMemberRole.ADMIN]), platformId, RoleType.DEFAULT]
            );

            await queryRunner.query(
                `INSERT INTO "rbac" ("id", "name", "permissions", "platformId", "type") VALUES ($1, $2, $3, $4, $5)`,
                [apId(), ProjectMemberRole.OPERATOR, JSON.stringify(rolePermissions[ProjectMemberRole.OPERATOR]), platformId, RoleType.DEFAULT]
            );
        }

        await queryRunner.query(`
            ALTER TABLE "project_member" ADD COLUMN "projectRoleId" character varying
        `)

        await queryRunner.query(`
            ALTER TABLE "project_member" 
            ADD CONSTRAINT "fk_project_member_project_role_id" 
            FOREIGN KEY ("projectRoleId") REFERENCES "rbac"("id") ON DELETE CASCADE
        `)

        const projectMemberRoles = await queryRunner.query(`
            SELECT pm.id, r.name as projectRole, pm."platformId"
            FROM project_member pm
            LEFT JOIN rbac r ON pm."projectRoleId" = r.id
        `);

        for (const projectMemberRole of projectMemberRoles) {
            const roleName = projectMemberRole.projectRole;
            const rbacIdResult = await queryRunner.query(
                `SELECT id FROM rbac WHERE name = $1 AND "platformId" = $2`,
                [roleName, projectMemberRole.platformId]
            );

            const rbacId = rbacIdResult[0]?.id;

            await queryRunner.query(
                `UPDATE "project_member" SET "projectRoleId" = $1 WHERE id = $2`,
                [rbacId, projectMemberRole.id]
            );
        }

        // Check if the column exists before attempting to drop it
        const columnExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='project_member' AND column_name='projectRole'
        `);

        if (columnExists.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "project_member" DROP COLUMN "projectRole"
            `);
        }

        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "role"
        `);

        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP COLUMN "projectRole"
        `)
        await queryRunner.query(`
            ALTER TABLE "user_invitation" ADD COLUMN "projectRoleId" character varying
        `)

        await queryRunner.query(`
            ALTER TABLE "user_invitation" 
            ADD CONSTRAINT "fk_user_invitation_project_role_id" 
            FOREIGN KEY ("projectRoleId") REFERENCES "rbac"("id") ON DELETE CASCADE
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP CONSTRAINT "fk_user_invitation_project_role_id"
        `)

        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP COLUMN "projectRoleId"
        `)

        await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_role_id"
        `)

        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "projectRoleId"
        `)

        await queryRunner.query(`
            DROP TABLE "rbac"
        `)
    }

}
