import { FastifyRequest } from 'fastify'
import { authenticateOrThrow } from './authenticate'

export const authenticationMiddleware = async (request: FastifyRequest): Promise<void> => {
    const principal = await authenticateOrThrow(request.headers['authorization'] ?? null, request.routeOptions.config?.security)
    request.principal = principal
}

