import { RouteAccessRequest, AuthorizationType, PublicRoute, RouteKind } from '@activepieces/server-shared'

import { ActivepiecesError, ErrorCode, PlatformRole, Principal, PrincipalType } from '@activepieces/shared'
import { userService } from '../../user/user-service'

export const authorizeOrThrow = async (principal: Principal, security: RouteAccessRequest<RawProjectResource> | PublicRoute): Promise<void> => {
    if (security.kind === RouteKind.PUBLIC) {
        return
    }
    switch (security.authorization.type) {
        case AuthorizationType.PROJECT:
            await assertPrinicpalIsOneOf(security.authorization.allowedPrincipals, principal.type)
            const projectResource = security.authorization.projectResource;
            await assertAccessToProject(principal, projectResource.projectId)
            break
        case AuthorizationType.PLATFORM:
            await assertPrinicpalIsOneOf(security.authorization.allowedPrincipals, principal.type)
            await assertPlatformIsOwnedByCurrentPrincipal(principal)
            break
        case AuthorizationType.WORKER:
            await assertPrinicpalIsOneOf([PrincipalType.WORKER], principal.type)
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


async function assertAccessToProject(principal: Principal, projectId: string | undefined): Promise<void> {
    
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

type AuthorizeOrThrowParams = {
    principal: Principal
    security: PublicRoute | RouteAccessRequest
}