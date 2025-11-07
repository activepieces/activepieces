import { FastifyRequest } from 'fastify'
import { principalTypeAuthz } from './authz/principal-type-authz'
import { RouteKind } from '@activepieces/server-shared'

export const authorizationMiddleware = async (request: FastifyRequest): Promise<void> => {
    const security = request.routeOptions.config?.security
    
    if (security.kind === RouteKind.PUBLIC) {
        return
    }

    await principalTypeAuthz.authorize(request, security)
}

