import { rolePermissions } from '@activepieces/ee-shared'
import { logger } from '@activepieces/server-shared'
import { DefaultProjectRole, ProjectRole, RoleType } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { ProjectRoleEntity } from '../../ee/project-role/project-role.entity'
import { DataSeed } from './data-seed'

const projectMemberRoleRepo = repoFactory(ProjectRoleEntity)

// DO NOT CHANGE THESE IDS OR SHUFFLE THEM
const roleIds: Record<DefaultProjectRole, string> = {
    [DefaultProjectRole.ADMIN]: '461ueYHzMykyk5dIL8HzQ',
    [DefaultProjectRole.EDITOR]: 'sjWe85TwaFYxyhn2AgOha', 
    [DefaultProjectRole.OPERATOR]: '3Wl9IAw5aM0HLafHgMYkb',
    [DefaultProjectRole.VIEWER]: 'aJVBSSJ3YqZ7r1laFjM0a',
}

export const rolesSeed: DataSeed = {
    run: async () => {
        logger.info({ name: 'rolesSeed' }, 'Seeding roles')
        for (const role of Object.values(DefaultProjectRole)) {
            const permissions = rolePermissions[role]
            const projectRole: Omit<ProjectRole, 'created' | 'updated'> = {
                name: role,
                permissions,
                type: RoleType.DEFAULT,
                id: roleIds[role],
            }
            await projectMemberRoleRepo().upsert(projectRole, ['id'])
        }
    },
}