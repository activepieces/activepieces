import { FastifyRequest } from 'fastify'
import { principalTypeAuthz } from './authz/principal-type-authz'
import { AuthorizationType, ProjectAuthorization, RouteKind } from '@activepieces/server-shared'
import { securityUtils } from './utils'
import { ActivepiecesError, ErrorCode, isNil, PrincipalType } from '@activepieces/shared'

export const authorizationMiddleware = async (request: FastifyRequest): Promise<void> => {
    if (request.routeOptions.config?.security.kind === RouteKind.PUBLIC) {
        return
    }

    switch (request.routeOptions.config?.security.authorization.type) {
        case AuthorizationType.PROJECT:
            await principalTypeAuthz.authorizeOrThrow(request, request.routeOptions.config?.security)
            await populateProjectInRequestOrThrow(request, request.routeOptions.config?.security.authorization)
            break
        case AuthorizationType.PLATFORM:
            await principalTypeAuthz.authorizeOrThrow(request, request.routeOptions.config?.security)
            break
        case AuthorizationType.WORKER:
        case AuthorizationType.NONE:
            break
    }
}

async function populateProjectInRequestOrThrow(request: FastifyRequest, projectAuthorization: ProjectAuthorization): Promise<void> {
    const projectId = await securityUtils.getProjectIdFromRequest(request, projectAuthorization)
    if (isNil(projectId)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'project id is not available for this route',
            },
        })
    }
    Object.assign(request.project { id: projectId })
}
