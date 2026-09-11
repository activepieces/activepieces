import { Permission } from '@activepieces/core-utils'
import { ApEdition, Project } from '@activepieces/shared'
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
    if (isPrivileged || !EDITION_REQUIRES_RBAC) {
        return projects
    }
    const roles = await Promise.all(projects.map((project) => projectMemberService(log).getRole({ projectId: project.id, userId })))
    return projects.filter((_project, index) => roles[index]?.permissions?.includes(Permission.READ_MCP))
}

export const mcpAccess = {
    listMcpAccessibleProjects,
}
