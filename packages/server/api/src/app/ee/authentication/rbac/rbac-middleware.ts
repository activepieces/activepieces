import { FastifyRequest } from 'fastify'
import { getEdition } from '../../../helper/secret-helper'
import { projectMemberService } from '../../project-members/project-member.service'
import { rolePermissions } from './access-control-list'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    FlowOperationType,
    isNil,
    Permission,
    Principal,
    PrincipalType,
    ProjectMemberRole,
} from '@activepieces/shared'

const EDITION_IS_COMMUNITY = getEdition() === ApEdition.COMMUNITY

export const rbacMiddleware = async (req: FastifyRequest): Promise<void> => {
    if (ignoreRequest(req)) {
        return
    }
    await assertRoleHasPermission(req.principal, req.routeConfig.permission)
}

export async function assertUserHasPermissionToFlow(
    principal: Principal,
    operationType: FlowOperationType,
): Promise<void> {
    const edition = getEdition()
    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return
    }

    switch (operationType) {
        case FlowOperationType.LOCK_AND_PUBLISH:
        case FlowOperationType.CHANGE_STATUS: {
            await assertRoleHasPermission(principal, Permission.UPDATE_FLOW_STATUS)
            break
        }
        case FlowOperationType.ADD_ACTION:
        case FlowOperationType.UPDATE_ACTION:
        case FlowOperationType.DELETE_ACTION:
        case FlowOperationType.LOCK_FLOW:
        case FlowOperationType.CHANGE_FOLDER:
        case FlowOperationType.CHANGE_NAME:
        case FlowOperationType.MOVE_ACTION:
        case FlowOperationType.IMPORT_FLOW:
        case FlowOperationType.UPDATE_TRIGGER:
        case FlowOperationType.DUPLICATE_ACTION:
        case FlowOperationType.USE_AS_DRAFT: {
            await assertRoleHasPermission(principal, Permission.WRITE_FLOW)
            break
        }
    }
}

const assertRoleHasPermission = async (principal: Principal, permission: Permission | undefined): Promise<void> => {
    if (principal.type === PrincipalType.SERVICE) { 
        return
    }
    const principalRole = await getPrincipalRoleOrThrow(principal)
    const access = grantAccess({
        principalRole,
        routePermission: permission,
    })
    if (!access) {
        throwPermissionDenied(principalRole, principal, permission)
    }
}


const ignoreRequest = (req: FastifyRequest): boolean => {
    if (EDITION_IS_COMMUNITY) {
        return true
    }

    const ignoredPrefixes = ['/redirect', '/ui', '/v1/project-members/accept']
    if (ignoredPrefixes.some(p => req.url.startsWith(p))) {
        return true
    }

    if (req.principal.type === PrincipalType.SERVICE) {
        return true
    }

    return req.routeConfig.permission === undefined
}

const getPrincipalRoleOrThrow = async (principal: Principal): Promise<ProjectMemberRole> => {
    const { id: userId, projectId } = principal

    const role = await projectMemberService.getRole({
        projectId,
        userId,
    })

    if (isNil(role)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'No role found',
                userId,
                projectId,
            },
        })
    }

    return role

}

const grantAccess = ({ principalRole, routePermission }: GrantAccessArgs): boolean => {
    if (isNil(routePermission)) {
        return true
    }

    const principalPermissions = rolePermissions[principalRole]
    return principalPermissions.includes(routePermission)
}

const throwPermissionDenied = (role: ProjectMemberRole, principal: Principal, permission: Permission | undefined): never => {
    throw new ActivepiecesError({
        code: ErrorCode.PERMISSION_DENIED,
        params: {
            userId: principal.id,
            projectId: principal.projectId,
            role,
            permission,
        },
    })
}

type GrantAccessArgs = {
    principalRole: ProjectMemberRole
    routePermission: Permission | undefined
}
