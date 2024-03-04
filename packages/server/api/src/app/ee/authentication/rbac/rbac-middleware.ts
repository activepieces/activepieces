import { FastifyRequest } from 'fastify'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    Permission,
    Principal,
    PrincipalType,
    ProjectMemberRole,
    isNil,
} from '@activepieces/shared'
import { projectMemberService } from '../../project-members/project-member.service'
import { getEdition } from '../../../helper/secret-helper'
import { rolePermissions } from './access-control-list'

const EDITION_IS_COMMUNITY = getEdition() === ApEdition.COMMUNITY

export const rbacMiddleware = async (req: FastifyRequest): Promise<void> => {
    if (ignoreRequest(req)) {
        return
    }

    const principalRole = await getPrincipalRoleOrThrow(req.principal)

    const access = grantAccess({
        principalRole,
        routePermission: req.routeConfig.permission,
    })

    if (!access) {
        throwPermissionDenied(req.principal)
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
