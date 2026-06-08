import { FastifyReply, FastifyRequest } from 'fastify'

export const canaryRoutingMiddleware = async (_request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    // Canary routing is not supported in Community Edition
}
