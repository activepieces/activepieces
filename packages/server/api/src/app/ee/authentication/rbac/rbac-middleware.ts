import { FastifyRequest } from 'fastify'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    PrincipalType,
    ProjectId,
    ProjectMemberRole,
    isNil,
} from '@activepieces/shared'
import { projectMemberService } from '../../project-members/project-member.service'
import { getEdition } from '../../../helper/secret-helper'
import { extractResourceName } from '../../../authentication/authorization'
import { ResourceAction, ResourceName, accessControlledResourceNames } from './resources'
import { accessControlList, rolePermissions } from './access-control-list'

const EDITION_IS_COMMUNITY = getEdition() === ApEdition.COMMUNITY

export const rbacMiddleware = async (req: FastifyRequest): Promise<void> => {
    if (ignoreRequest(req)) {
        return
    }

    const resourceName = extractResourceNameOrThrow(req)
    const resourceAction = extractResourceAction(req)
    const projectId = req.principal.projectId

    const role = await getRoleOrThrow({
        projectId,
        userId: req.principal.id,
        resourceName,
        resourceAction,
    })

    const access = grantAccess({
        role,
        resourceName,
        resourceAction,
    })

    if (!access) {
        throwPermissionDenied({
            projectId,
            resourceName,
            resourceAction,
        })
    }
}

const grantAccess = ({ role, resourceName, resourceAction }: GrantAccessArgs): boolean => {
    const permissions = rolePermissions[role]

    return permissions.some(permission => {
        const { resource, actions } = accessControlList[permission]
        return resource === resourceName && actions.includes(resourceAction)
    })
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

    const resourceName = extractResourceNameOrThrow(req)

    return !accessControlledResourceNames.includes(resourceName)
}

const getRoleOrThrow = async (params: GetRoleOrThrowArgs): Promise<ProjectMemberRole> => {
    const { projectId, userId } = params

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

const extractResourceNameOrThrow = (req: FastifyRequest): ResourceName => {
    const resourceName = extractResourceName(req.url) as ResourceName | undefined

    if (isNil(resourceName)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Invalid resource',
            },
        })
    }

    return resourceName
}

const extractResourceAction = (req: FastifyRequest): ResourceAction => {
    return req.method as ResourceAction
}

const throwPermissionDenied = ({ projectId, resourceName, resourceAction }: ThrowPermissionDeniedArgs): never => {
    throw new ActivepiecesError({
        code: ErrorCode.PERMISSION_DENIED,
        params: {
            projectId,
            resource: resourceName,
            action: resourceAction,
        },
    })
}

type GrantAccessArgs = {
    role: ProjectMemberRole
    resourceName: ResourceName
    resourceAction: ResourceAction
}

type ThrowPermissionDeniedArgs = {
    projectId: ProjectId
    resourceName: ResourceName
    resourceAction: ResourceAction
}

type GetRoleOrThrowArgs = {
    projectId: ProjectId
    userId: string
    resourceName: ResourceName
    resourceAction: ResourceAction
}
