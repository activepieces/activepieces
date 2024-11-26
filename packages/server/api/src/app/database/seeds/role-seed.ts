import { rolePermissions } from '@activepieces/ee-shared'
import { logger } from '@activepieces/server-shared'
import { DefaultProjectRole, RoleType } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { ProjectRoleEntity } from '../../ee/project-role/project-role.entity'
import { DataSeed } from './data-seed'

const projectMemberRoleRepo = repoFactory(ProjectRoleEntity)

export const rolesSeed: DataSeed = {
    run: async () => {
        logger.info({ name: 'rolesSeed' }, 'Seeding roles')
        for (const role of Object.values(DefaultProjectRole)) {
            const permissions = rolePermissions[role]
            await projectMemberRoleRepo().update({
                name: role,
                type: RoleType.DEFAULT,
            }, {
                permissions,
            })
        }
    },
}