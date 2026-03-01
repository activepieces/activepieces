import { MigrationInterface, QueryRunner } from 'typeorm'
const mapToNewPermission = (permission: string) => {
    if (permission === 'READ_GIT_REPO') {
        return 'READ_PROJECT_RELEASE'
    }
    if (permission === 'WRITE_GIT_REPO') {
        return 'WRITE_PROJECT_RELEASE'
    }
    return permission
}

const mapToOldPermission = (permission: string) => {
    if (permission === 'READ_PROJECT_RELEASE') {
        return 'READ_GIT_REPO' 
    }
    if (permission === 'WRITE_PROJECT_RELEASE') {
        return 'WRITE_GIT_REPO'
    }
    return permission
}

export class RenameGitRepoPermission1736813103505 implements MigrationInterface {
    name = 'RenameGitRepoPermission1736813103505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const allProjectRoles = await queryRunner.query('SELECT * FROM "project_role"')
        
        for (const projectRole of allProjectRoles) {
            const newPermissions = projectRole.permissions.map((permission: string) => mapToNewPermission(permission))
            await queryRunner.query('UPDATE "project_role" SET "permissions" = $1 WHERE "id" = $2', [newPermissions, projectRole.id])
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const allProjectRoles = await queryRunner.query('SELECT * FROM "project_role"')
        for (const projectRole of allProjectRoles) {
            const newPermissions = projectRole.permissions.map((permission: string) => mapToOldPermission(permission))
            await queryRunner.query('UPDATE "project_role" SET "permissions" = $1 WHERE "id" = $2', [newPermissions, projectRole.id])
        }
    }
}
