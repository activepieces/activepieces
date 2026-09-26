import { isNil, Permission } from '@activepieces/core-utils'
import { McpReachResponse, McpToolResult, Project } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { editionRequiresRbac } from '../ee/authentication/project-role/rbac-middleware'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'

export const mcpAccess = {
    listAccessibleProjects,
    resolveReach,
    hasMcpReach,
    hasMcpAccessToProject,
    noMcpReachResult,
}

async function listAccessibleProjects({ platformId, userId, log }: UserScope): Promise<Project[]> {
    const isPrivileged = await isUserPrivileged({ userId, log })
    return listProjectsForUser({ platformId, userId, isPrivileged, log })
}

async function resolveReach({ platformId, userId, log }: UserScope): Promise<McpReachResponse> {
    const isPrivileged = await isUserPrivileged({ userId, log })
    if (isPrivileged) {
        return { projectIds: null }
    }
    const projects = await listProjectsForUser({ platformId, userId, isPrivileged, log })
    return { projectIds: projects.map((project) => project.id) }
}

async function hasMcpReach({ platformId, userId, log }: UserScope): Promise<boolean> {
    const { projectIds } = await resolveReach({ platformId, userId, log })
    return isNil(projectIds) || projectIds.length > 0
}

async function hasMcpAccessToProject({ platformId, userId, projectId, log }: UserScope & { projectId: string }): Promise<boolean> {
    const isPrivileged = await isUserPrivileged({ userId, log })
    if (isPrivileged) {
        const project = await projectService(log).getOne(projectId)
        return !isNil(project) && project.platformId === platformId
    }
    const projects = await listProjectsForUser({ platformId, userId, isPrivileged, log })
    return projects.some((project) => project.id === projectId)
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

async function isUserPrivileged({ userId, log }: Omit<UserScope, 'platformId'>): Promise<boolean> {
    const user = await userService(log).getOneOrFail({ id: userId })
    return userService(log).isUserPrivileged(user)
}

async function listProjectsForUser({ platformId, userId, isPrivileged, log }: UserScope & {
    isPrivileged: boolean
}): Promise<Project[]> {
    const projects = await projectService(log).getAllForUser({ platformId, userId, isPrivileged })

    if (!editionRequiresRbac() || isPrivileged || projects.length === 0) {
        return projects
    }

    const projectIdsGrantingMcp = new Set(await projectMemberService(log).listProjectIdsWithPermission({ userId, platformId, permission: Permission.READ_MCP }))

    return projects.filter((project) => project.ownerId === userId || projectIdsGrantingMcp.has(project.id))
}

type UserScope = {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}
