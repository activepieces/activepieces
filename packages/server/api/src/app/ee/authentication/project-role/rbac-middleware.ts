import { AuthorizationRouteSecurity, AuthorizationType, ProjectAuthorizationConfig, RouteKind } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    ApId,
    ErrorCode,
    FlowOperationType,
    isNil,
    Permission,
    Principal,
    PrincipalType,
    ProjectId,
    ProjectRole,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { convertToSecurityAccessRequest } from '../../../core/security/v2/authz/authorization-middleware'
import { system } from '../../../helper/system/system'
import { projectMemberService } from '../../projects/project-members/project-member.service'
import { projectRoleService } from '../../projects/project-role/project-role.service'

const EDITION_IS_COMMUNITY = system.getEdition() === ApEdition.COMMUNITY

export const rbacMiddleware = async (req: FastifyRequest): Promise<void> => {
    if (ignoreRequest(req)) {
        return
    }
    const securityAccessRequest = await convertToSecurityAccessRequest(req)
    const projectAuthConfig = extractProjectConfig(securityAccessRequest)
    if (isNil(projectAuthConfig) || isNil(projectAuthConfig.permission) || isNil(projectAuthConfig.projectId)) {
        return
    }
    await assertRoleHasPermission(req.principal, projectAuthConfig.projectId, projectAuthConfig.permission, req.log)
}

export async function assertUserHasPermissionToFlow(
    principal: Principal,
    projectId: ProjectId,
    operationType: FlowOperationType,
    log: FastifyBaseLogger,
): Promise<void> {
    const edition = system.getEdition()
    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return
    }

    switch (operationType) {
        case FlowOperationType.LOCK_AND_PUBLISH:
        case FlowOperationType.CHANGE_STATUS: {
            await assertRoleHasPermission(principal, projectId, Permission.UPDATE_FLOW_STATUS, log)
            break
        }
        case FlowOperationType.UPDATE_MINUTES_SAVED: 
        case FlowOperationType.SAVE_SAMPLE_DATA: 
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
        case FlowOperationType.USE_AS_DRAFT:
        case FlowOperationType.ADD_BRANCH:
        case FlowOperationType.DELETE_BRANCH:
        case FlowOperationType.DUPLICATE_BRANCH:
        case FlowOperationType.UPDATE_METADATA:
        case FlowOperationType.SET_SKIP_ACTION:
        case FlowOperationType.MOVE_BRANCH: {
            await assertRoleHasPermission(principal, projectId, Permission.WRITE_FLOW, log)
            break
        }
      
    }
}

export const assertRoleHasPermission = async (principal: Principal, projectId: ProjectId, permission: Permission, log: FastifyBaseLogger): Promise<void> => {
    if (principal.type !== PrincipalType.USER) { 
        return
    }
    const principalRole = await getPrincipalRoleOrThrow(principal.id, projectId, log)
    const access = await grantAccess({
        principalRoleId: principalRole.id,
        routePermission: permission,
    })
    if (!access) {
        throwPermissionDenied(principalRole, principal.id, projectId, permission)
    }
}

const ignoreRequest = (req: FastifyRequest): boolean => {
    if (EDITION_IS_COMMUNITY) {
        return true
    }
    const ignoredPrefixes = ['/redirect', '/ui']
    if (ignoredPrefixes.some(p => req.url.startsWith(p))) {
        return true
    }
    return false
}

const extractProjectConfig = (securityAccessRequest: AuthorizationRouteSecurity): ProjectAuthorizationConfig | undefined => {
    if (securityAccessRequest.kind !== RouteKind.AUTHENTICATED || securityAccessRequest.authorization.type !== AuthorizationType.PROJECT) {
        return undefined
    }
    return securityAccessRequest.authorization
}

export const getPrincipalRoleOrThrow = async (userId: ApId, projectId: ProjectId, log: FastifyBaseLogger): Promise<ProjectRole> => {
    const projectRole = await projectMemberService(log).getRole({
        projectId,
        userId,
    })

    if (isNil(projectRole)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'No role found for the user',
                userId,
                projectId,
            },
        })
    }

    return projectRole

}

const grantAccess = async ({ principalRoleId, routePermission }: GrantAccessArgs): Promise<boolean> => {
    if (isNil(routePermission)) {
        return true
    }

    const principalRole = await projectRoleService.getOneOrThrowById({
        id: principalRoleId,
    })
    
    if (isNil(principalRole)) {
        return false
    }

    return principalRole.permissions?.includes(routePermission)
}

const throwPermissionDenied = (projectRole: ProjectRole, userId: ApId, projectId: ProjectId, permission: Permission | undefined): never => {
    throw new ActivepiecesError({
        code: ErrorCode.PERMISSION_DENIED,
        params: {
            userId,
            projectId,
            projectRole,
            permission,
        },
    })
}

type GrantAccessArgs = {
    principalRoleId: ApId
    routePermission: Permission | undefined
}
