import { FastifyRequest } from 'fastify'
import { getEdition } from '../../../helper/secret-helper'
import { projectMemberService } from '../../project-members/project-member.service'
import { rolePermissions } from './access-control-list'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
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

export const assertRoleHasPermission = async (principal: Principal, permission: Permission | undefined): Promise<void> => {
    const principalRole = await getPrincipalRoleOrThrow(principal)
    const access = grantAccess({
        principalRole,
        routePermission: permission,
    })
    if (!access) {
        throwPermissionDenied(principal)
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

const throwPermissionDenied = (principal: Principal): never => {
    throw new ActivepiecesError({
        code: ErrorCode.PERMISSION_DENIED,
        params: {
            userId: principal.id,
            projectId: principal.projectId,
        },
    })
}

type GrantAccessArgs = {
    principalRole: ProjectMemberRole
    routePermission: Permission | undefined
}
