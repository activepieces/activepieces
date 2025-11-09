import { FastifyRequest } from 'fastify'
import { principalTypeAuthz } from './authz/principal-type-authz'
import { AuthorizationType, RouteKind } from '@activepieces/server-shared'
import { securityUtils } from './utils'
import { PrincipalType } from '@activepieces/shared'

export const authorizationMiddleware = async (request: FastifyRequest): Promise<void> => {
    const security = request.routeOptions.config?.security
    
    if (security.kind === RouteKind.PUBLIC) {
        return
    }

    await principalTypeAuthz.authorize(request, security)
    
    if (security.authorization.type === AuthorizationType.PROJECT && (request.principal.type === PrincipalType.USER || request.principal.type === PrincipalType.SERVICE)) {
        request.principal.project = {
            id: await securityUtils.getProjectIdFromRequest(request),
        }   
    }
}

