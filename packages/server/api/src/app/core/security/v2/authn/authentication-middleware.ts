import { RouteKind } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { authenticateOrThrow } from './authenticate'

export const authenticationMiddleware = async (request: FastifyRequest): Promise<void> => {
    const security = request.routeOptions.config?.security
    // Todo(@chaker): remove this once we remove v1 authn
    if (isNil(security)) {
        return
    }
    if (security.kind === RouteKind.PUBLIC) {
        return
    }

    const principal = await authenticateOrThrow(request.headers['authorization'] ?? null)
    request.principal = principal
}

