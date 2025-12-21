import { AuthorizationRouteSecurity, AuthorizationType, MaybeProjectAuthorizationConfig, ProjectAuthorizationConfig, RouteKind } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, isNil, PlatformRole, Principal, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { rbacService } from '../../../../ee/authentication/project-role/rbac-service'
import { userService } from '../../../../user/user-service'

const NON_PROJECT_PRINCIPAL_TYPES = [PrincipalType.UNKNOWN, PrincipalType.WORKER]

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
                await assertPlatformIsOwnedByCurrentPrincipal(principal)
            }
            break
        case AuthorizationType.MAYBE_PROJECT:
            await assertPrinicpalIsOneOf(security.authorization.allowedPrincipals, principal.type)
            if (!NON_PROJECT_PRINCIPAL_TYPES.includes(principal.type) && !isNil(security.authorization.projectResource)) {
                await assertAccessToProject(principal, security.authorization, log)
            }
            break
        case AuthorizationType.UNSCOPED:
            await assertPrinicpalIsOneOf(security.authorization.allowedPrincipals, principal.type)
            break
        case AuthorizationType.NONE:
            break
    }
}


async function assertPlatformIsOwnedByCurrentPrincipal(principal: Principal): Promise<void> {
    if (principal.type === PrincipalType.SERVICE) {
        return
    }
    const user = await userService.getOneOrFail({ id: principal.id })
    if (user.platformRole !== PlatformRole.ADMIN) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'User is not an admin/owner of the platform.',
            },
        })
    }
}


async function assertAccessToProject(principal: Principal, projectSecurity: ProjectAuthorizationConfig | MaybeProjectAuthorizationConfig, log: FastifyBaseLogger): Promise<void> {
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