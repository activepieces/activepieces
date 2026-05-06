import { FastifyInstance } from 'fastify'
import { securityAccess } from '../../core/security/authorization/fastify-security'

export const openapiController = async (fastify: FastifyInstance) => {
    fastify.get('/', GetOpenApiParams, async () => {
        return JSON.stringify(fastify.swagger(), null, 2)
    })
}

const GetOpenApiParams = {
    config: {
        security: securityAccess.public(),
    },
}