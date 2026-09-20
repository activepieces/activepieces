import { Permission } from '@activepieces/core-utils'
import { DefaultProjectRole, McpToolResult, Project, User } from '@activepieces/shared'
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
    return listProjectsForUser({ user, platformId, log })
}

async function listProjectsForUser({ user, platformId, log }: {
    user: User
    platformId: string
    log: FastifyBaseLogger
}): Promise<Project[]> {
    const isPrivileged = userService(log).isUserPrivileged(user)
    const projects = await projectService(log).getAllForUser({ platformId, userId: user.id, isPrivileged })

    if (!editionRequiresRbac() || isPrivileged || projects.length === 0) {
        return projects
    }

    const ownsAProject = projects.some((project) => project.ownerId === user.id)
    const [ownedProjectRoleGrantsMcp, memberProjectIdsGrantingMcp] = await Promise.all([
        ownsAProject ? defaultRoleGrantsMcp({ platformId, roleName: DefaultProjectRole.ADMIN }) : Promise.resolve(false),
        projectMemberService(log).listProjectIdsWithPermission({ userId: user.id, platformId, permission: Permission.READ_MCP }).then((projectIds) => new Set(projectIds)),
    ])

    return projects.filter((project) => project.ownerId === user.id
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

async function hasMcpReach({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<boolean> {
    const user = await userService(log).getOneOrFail({ id: userId })
    if (userService(log).isUserPrivileged(user)) {
        return true
    }
    const projects = await listProjectsForUser({ user, platformId, log })
    return projects.length > 0
}

function noMcpReachResult(toolTitle: string): McpToolResult {
    return {
        content: [{
            type: 'text' as const,
            text: `❌ Permission denied: your role does not have the "${Permission.READ_MCP}" permission in any project. Cannot execute "${toolTitle}".`,
        }],
        isError: true,
    }
}

export const mcpAccess = {
    listAccessibleProjects,
    hasMcpReach,
    noMcpReachResult,
}
