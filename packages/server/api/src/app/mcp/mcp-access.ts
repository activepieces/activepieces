import { Permission } from '@activepieces/core-utils'
import { DefaultProjectRole, Project } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { editionRequiresRbac } from '../ee/authentication/project-role/rbac-middleware'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { projectRoleService } from '../ee/projects/project-role/project-role.service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'

async function listAccessibleProjects({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<Project[]> {
    const user = await userService(log).getOneOrFail({ id: userId })
    const isPrivileged = userService(log).isUserPrivileged(user)
    const projects = await projectService(log).getAllForUser({ platformId, userId, isPrivileged })

    if (!editionRequiresRbac() || isPrivileged || projects.length === 0) {
        return projects
    }

    const [ownedProjectRoleGrantsMcp, memberProjectIdsGrantingMcp] = await Promise.all([
        defaultRoleGrantsMcp({ platformId, roleName: DefaultProjectRole.ADMIN }),
        projectMemberService(log).listProjectIdsWithPermission({ userId, platformId, permission: Permission.READ_MCP }).then((projectIds) => new Set(projectIds)),
    ])

    return projects.filter((project) => project.ownerId === userId
        ? ownedProjectRoleGrantsMcp
        : memberProjectIdsGrantingMcp.has(project.id))
}

async function defaultRoleGrantsMcp({ platformId, roleName }: {
    platformId: string
    roleName: DefaultProjectRole
}): Promise<boolean> {
    const role = await projectRoleService.getOne({ name: roleName, platformId })
    return role?.permissions?.includes(Permission.READ_MCP) ?? false
}

export const mcpAccess = {
    listAccessibleProjects,
}
