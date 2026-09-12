import { Permission } from '@activepieces/core-utils'
import { ApEdition, PlatformRole, Project, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { system } from '../helper/system/system'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'

const EDITION_REQUIRES_RBAC = [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())

async function listMcpAccessibleProjects({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<Project[]> {
    const user = await userService(log).getOneOrFail({ id: userId })
    const isPrivileged = userService(log).isUserPrivileged(user)
    const projects = await projectService(log).getAllForUser({ platformId, userId, isPrivileged })

    if (!EDITION_REQUIRES_RBAC || user.platformRole === PlatformRole.ADMIN) {
        return projects
    }
    if (isPrivileged) {
        return projects.filter((project) => project.type !== ProjectType.PERSONAL || project.ownerId === userId)
    }
    const mcpProjectIds = new Set(await projectMemberService(log).listProjectIdsWithPermission({ userId, platformId, permission: Permission.READ_MCP }))
    return projects.filter((project) => mcpProjectIds.has(project.id) || (project.type === ProjectType.PERSONAL && project.ownerId === userId))
}

export const mcpAccess = {
    listMcpAccessibleProjects,
}
