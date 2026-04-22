import { ActivepiecesError, ErrorCode, isNil, Permission, PlatformRole, Principal, PrincipalType, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../../../authentication/user-identity/user-identity-service'
import { rbacService } from '../../../../ee/authentication/project-role/rbac-service'
import { projectMemberService } from '../../../../ee/projects/project-members/project-member.service'
import { userService } from '../../../../user/user-service'
import { AuthorizationRouteSecurity, ProjectAuthorizationConfig } from '../../authorization/authorization'
import { AuthorizationType, RouteKind } from '../../authorization/common'

export const authorizeOrThrow = async (principal: Principal, security: AuthorizationRouteSecurity, log: FastifyBaseLogger): Promise<void> => {
    if (security.kind === RouteKind.PUBLIC) {
        return
    }
    switch (security.authorization.type) {
        case AuthorizationType.PROJECT:
            await assertPrinicpalIsOneOf(security.authorization.allowedPrincipals, principal.type)
            await assertAccessToProject(principal, security.authorization, log)
            break
        case AuthorizationType.PLATFORM:
            await assertPrinicpalIsOneOf(security.authorization.allowedPrincipals, principal.type)
            if (security.authorization.adminOnly) {
                await assertPlatformIsOwnedByCurrentPrincipal(principal, log)
            }
            if (security.authorization.nonEmbedUsersOnly) {
                await assertNonEmbedOrAdmin(principal, log)
            }
            break
        case AuthorizationType.UNSCOPED:
            await assertPrinicpalIsOneOf(security.authorization.allowedPrincipals, principal.type)
            break
        case AuthorizationType.NONE:
            break
    }
}


async function assertNonEmbedOrAdmin(principal: Principal, log: FastifyBaseLogger): Promise<void> {
    if (principal.type === PrincipalType.SERVICE) {
        return
    }
    const user = await userService(log).getOneOrFail({ id: principal.id })
    if (user.platformRole === PlatformRole.ADMIN) {
        return
    }
    const identity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
    if (identity.provider === UserIdentityProvider.JWT) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Embed users are not allowed to access this resource.',
            },
        })
    }
    if (isNil(user.platformId)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'User is not associated with a platform.',
            },
        })
    }
    const hasInvitePermission = await projectMemberService(log).hasPermissionOnAnyProject({
        userId: user.id,
        platformId: user.platformId,
        permission: Permission.WRITE_INVITATION,
    })
    if (!hasInvitePermission) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'User does not have invite permission on any project.',
            },
        })
    }
}

async function assertPlatformIsOwnedByCurrentPrincipal(principal: Principal, log: FastifyBaseLogger): Promise<void> {
    if (principal.type === PrincipalType.SERVICE) {
        return
    }
    const user = await userService(log).getOneOrFail({ id: principal.id })
    if (user.platformRole !== PlatformRole.ADMIN) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'User is not an admin/owner of the platform.',
            },
        })
    }
}


async function assertAccessToProject(principal: Principal, projectSecurity: ProjectAuthorizationConfig, log: FastifyBaseLogger): Promise<void> {
    if (isNil(projectSecurity.projectId)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Project ID is required',
            },
        })
    }
    await rbacService(log).assertPrinicpalAccessToProject({ principal, permission: projectSecurity.permission, projectId: projectSecurity.projectId })
}


async function assertPrinicpalIsOneOf< T extends readonly PrincipalType[]>(allowedPrincipals: T, currentPrincipal: PrincipalType): Promise<void> {
    if (!allowedPrincipals.includes(currentPrincipal)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'principal is not allowed for this route',
            },
        })
    }
}