import { FastifyRequest } from 'fastify'
import { ActivepiecesError, ApEdition, ErrorCode, isNil } from '@activepieces/shared'
import { projectMemberService } from '../../ee/project-members/project-member.service'
import { ProjectMemberPermission, ProjectMemberRole, ProjectMemberRoleToPermissions } from '@activepieces/ee-shared'
import { getEdition } from '../../helper/secret-helper'

const ProjectMemberPermissionResourceAndAction = {
    [ProjectMemberPermission.READ_FLOW]: {
        resource: 'flows',
        action: ['GET'],
    },
    [ProjectMemberPermission.WRITE_FLOW]: {
        resource: 'flows',
        action: ['POST', 'DELETE'],
    },
    [ProjectMemberPermission.READ_CONNECTION]: {
        resource: 'connections',
        action: ['GET'],
    },
    [ProjectMemberPermission.WRITE_CONNECTION]: {
        resource: 'connections',
        action: ['POST', 'DELETE'],
    },
    [ProjectMemberPermission.READ_PROJECT_MEMBER]: {
        resource: 'project-members',
        action: ['GET'],
    },
    [ProjectMemberPermission.WRITE_PROJECT_MEMBER]: {
        resource: 'project-members',
        action: ['POST', 'DELETE'],
    },
}

const managedResources = [
    'flows',
    'connections',
    'project-members',
]

export const rbacAuthMiddleware = async (req: FastifyRequest): Promise<void> => {
    const edition = getEdition()
    if (edition === ApEdition.COMMUNITY) {
        return
    }
    if (req.url.startsWith('/redirect')) {
        return
    }
    const action = req.method
    const resource = extractResourceName(req.url)
    const projectMemberRole = await projectMemberService.getRole({
        projectId: req.principal.projectId,
        userId: req.principal.id,
    })
    if (isNil(resource)) {
        throw new Error('Internal error: resource is undefined ' + req.url)
    }
    if (!managedResources.includes(resource)) {
        return
    }
    if (isNil(projectMemberRole)) {
        throw new ActivepiecesError({
            code: ErrorCode.PERMISSION_DENIED,
            params: {
                projectId: req.principal.projectId,
                resource,
                action,
            },
        })
    }
    const permission = await hasPermission({
        role: projectMemberRole,
        resource,
        action,
    })
    if (!permission) {
        throw new ActivepiecesError({
            code: ErrorCode.PERMISSION_DENIED,
            params: {
                projectId: req.principal.projectId,
                resource,
                action,
            },
        })
    }
}

async function hasPermission({
    role,
    resource,
    action,
}: { role: ProjectMemberRole, resource: string, action: string }): Promise<boolean> {
    const permissions = ProjectMemberRoleToPermissions[role]
    const permission = permissions.find((permission: ProjectMemberPermission) => {
        const { resource: permissionResource, action: permissionAction } = ProjectMemberPermissionResourceAndAction[permission]
        return permissionResource === resource && permissionAction.includes(action)
    })
    return !!permission
}


function extractResourceName(url: string): string | undefined {
    const resourceRegex = /\/v1\/(.+?)(\/|$)/
    const resourceMatch = url.match(resourceRegex)
    const resource = resourceMatch ? resourceMatch[1] : undefined
    return resource
}