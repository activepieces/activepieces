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
    ProjectRole,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { system } from '../../../helper/system/system'
import { projectMemberService } from '../../project-members/project-member.service'
import { projectRoleService } from '../../project-role/project-role.service'

const EDITION_IS_COMMUNITY = system.getEdition() === ApEdition.COMMUNITY

export const rbacMiddleware = async (req: FastifyRequest): Promise<void> => {
    if (ignoreRequest(req)) {
        return
    }
    await assertRoleHasPermission(req.principal, req.routeConfig.permission, req.log)
}

export async function assertUserHasPermissionToFlow(
    principal: Principal,
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
            await assertRoleHasPermission(principal, Permission.UPDATE_FLOW_STATUS, log)
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
        case FlowOperationType.USE_AS_DRAFT:
        case FlowOperationType.ADD_BRANCH:
        case FlowOperationType.DELETE_BRANCH:
        case FlowOperationType.DUPLICATE_BRANCH:
        case FlowOperationType.UPDATE_METADATA:
        case FlowOperationType.SET_SKIP_ACTION:
        case FlowOperationType.MOVE_BRANCH: {
            await assertRoleHasPermission(principal, Permission.WRITE_FLOW, log)
            break
        }
      
    }
}

export const assertRoleHasPermission = async (principal: Principal, permission: Permission | undefined, log: FastifyBaseLogger): Promise<void> => {
    if (principal.type === PrincipalType.SERVICE || principal.type === PrincipalType.ENGINE) { 
        return
    }
    const principalRole = await getPrincipalRoleOrThrow(principal, log)
    const access = await grantAccess({
        principalRoleId: principalRole.id,
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

    const ignoredPrefixes = ['/redirect', '/ui']
    if (ignoredPrefixes.some(p => req.url.startsWith(p))) {
        return true
    }

    if (req.principal.type === PrincipalType.SERVICE || req.principal.type === PrincipalType.ENGINE) {
        return true
    }

    return req.routeConfig.permission === undefined
}

export const getPrincipalRoleOrThrow = async (principal: Principal, log: FastifyBaseLogger): Promise<ProjectRole> => {
    const { id: userId, projectId } = principal

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

const throwPermissionDenied = (projectRole: ProjectRole, principal: Principal, permission: Permission | undefined): never => {
    throw new ActivepiecesError({
        code: ErrorCode.PERMISSION_DENIED,
        params: {
            userId: principal.id,
            projectId: principal.projectId,
            projectRole,
            permission,
        },
    })
}

type GrantAccessArgs = {
    principalRoleId: ApId
    routePermission: Permission | undefined
}
