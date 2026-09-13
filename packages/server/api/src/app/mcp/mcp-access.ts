import { Permission } from '@activepieces/core-utils'
import { ApEdition, Project } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { system } from '../helper/system/system'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'

async function listMcpAccessibleProjects({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<Project[]> {
    const user = await userService(log).getOneOrFail({ id: userId })
    const isPrivileged = userService(log).isUserPrivileged(user)
    const projects = await projectService(log).getAllForUser({ platformId, userId, isPrivileged })

    if (!editionRequiresRbac() || isPrivileged) {
        return projects
    }

    const projectIdsGrantingMcp = new Set(await projectMemberService(log).listProjectIdsWithPermission({
        userId,
        platformId,
        permission: Permission.READ_MCP,
    }))
    return projects.filter((project) => project.ownerId === userId || projectIdsGrantingMcp.has(project.id))
}

function editionRequiresRbac(): boolean {
    return [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())
}

export const mcpAccess = {
    listMcpAccessibleProjects,
    editionRequiresRbac,
}
