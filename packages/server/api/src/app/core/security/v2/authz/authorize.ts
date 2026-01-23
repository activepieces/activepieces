import { AuthorizationRouteSecurity, AuthorizationType, ProjectAuthorizationConfig, RouteKind } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, isNil, PlatformRole, Principal, PrincipalType, ProjectId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { projectService } from '../../../../project/project-service'
import { userService } from '../../../../user/user-service'

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


async function assertAccessToProject(principal: Principal, projectSecurity: ProjectAuthorizationConfig, _log: FastifyBaseLogger): Promise<void> {
    if (isNil(projectSecurity.projectId)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Project ID is required',
            },
        })
    }
    // Simplified authorization - just check if user has access to project
    await assertPrincipalAccessToProject({ principal, projectId: projectSecurity.projectId })
}

async function assertPrincipalAccessToProject({ principal, projectId }: { principal: Principal, projectId: ProjectId }): Promise<void> {
    if (principal.type === PrincipalType.SERVICE) {
        return
    }
    if (principal.type === PrincipalType.ENGINE) {
        // Engine principals have projectId embedded in the token
        if (principal.projectId === projectId) {
            return
        }
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Engine does not have access to this project',
            },
        })
    }
    if (principal.type === PrincipalType.USER) {
        const project = await projectService.getOneOrThrow(projectId)
        if (project.platformId !== principal.platform?.id) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'User does not have access to this project',
                },
            })
        }
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.AUTHORIZATION,
        params: {
            message: 'principal is not allowed for this route',
        },
    })
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
