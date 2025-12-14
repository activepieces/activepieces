import { FastifyRequest } from 'fastify'
import { authenticateOrThrow } from './authenticate'
import { RouteKind } from '@activepieces/server-shared'

export const authenticationMiddleware = async (request: FastifyRequest): Promise<void> => {
    const security = request.routeOptions.config?.security
    if (!security || security.kind === RouteKind.PUBLIC) {
        return
    }

    const principal = await authenticateOrThrow(request.headers['authorization'] ?? null)
    request.principal = principal
}

