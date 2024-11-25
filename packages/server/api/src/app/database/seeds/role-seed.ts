import { rolePermissions } from '@activepieces/ee-shared'
import { logger } from '@activepieces/server-shared'
import { DefaultProjectRole, ProjectRole, RoleType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { repoFactory } from '../../core/db/repo-factory'
import { ProjectRoleEntity } from '../../ee/project-role/project-role.entity'
import { DataSeed } from './data-seed'

const projectMemberRoleRepo = repoFactory(ProjectRoleEntity)

const roleIds: Record<DefaultProjectRole, string> = {
    [DefaultProjectRole.ADMIN]: 'aJVBSSJ3YqZ7r1laFjM0a',
    [DefaultProjectRole.EDITOR]: 'sjWe85TwaFYxyhn2AgOha', 
    [DefaultProjectRole.OPERATOR]: '461ueYHzMykyk5dIL8HzQ',
    [DefaultProjectRole.VIEWER]: '3Wl9IAw5aM0HLafHgMYkb',
}

export const rolesSeed: DataSeed = {
    run: async () => {
        logger.info({ name: 'rolesSeed' }, 'Seeding roles')
        for (const role of Object.values(DefaultProjectRole)) {
            const permissions = rolePermissions[role]
            const projectRole: ProjectRole = {
                name: role,
                permissions,
                type: RoleType.DEFAULT,
                id: roleIds[role],
                created: dayjs().toISOString(),
                updated: dayjs().toISOString(),
            }
            await projectMemberRoleRepo().upsert(projectRole, ['id'])
        }
    },
}