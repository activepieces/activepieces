import { FastifyRequest } from 'fastify'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    PrincipalType,
    ProjectMemberRole,
    isNil,
} from '@activepieces/shared'
import { projectMemberService } from '../../ee/project-members/project-member.service'
import {
    ProjectMemberPermission,
    ProjectMemberRoleToPermissions,
} from '@activepieces/ee-shared'
import { getEdition } from '../../helper/secret-helper'
import { extractResourceName } from '../../authentication/authorization'

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
    [ProjectMemberPermission.READ_ACTIVITY]: {
        resource: 'activities',
        action: ['GET'],
    },
}

const managedResources = [
    'activities',
    'app-connections',
    'flows',
    'project-members',
]

export const rbacAuthMiddleware = async (
    req: FastifyRequest,
): Promise<void> => {
    const edition = getEdition()
    if (edition === ApEdition.COMMUNITY) {
        return
    }
    if (
        req.url.startsWith('/redirect') ||
    req.url.startsWith('/ui') ||
    req.url.startsWith('/v1/project-members/accept')
    ) {
        return
    }
    const action = req.method
    const resource = extractResourceName(req.url)
    if (isNil(resource)) {
        throw new Error('Internal error: resource is undefined ' + req.url)
    }
    if (!managedResources.includes(resource)) {
        return
    }
    if (req.principal.type === PrincipalType.SERVICE) {
        return
    }
    const projectMemberRole = await projectMemberService.getRole({
        projectId: req.principal.projectId,
        userId: req.principal.id,
    })

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
}: {
    role: ProjectMemberRole
    resource: string
    action: string
}): Promise<boolean> {
    const permissions = ProjectMemberRoleToPermissions[role]
    const permission = permissions.find((permission: ProjectMemberPermission) => {
        const { resource: permissionResource, action: permissionAction } =
      ProjectMemberPermissionResourceAndAction[permission]
        return permissionResource === resource && permissionAction.includes(action)
    })
    return !!permission
}
