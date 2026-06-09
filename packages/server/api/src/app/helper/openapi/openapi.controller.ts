import { FastifyInstance } from 'fastify'
import { securityAccess } from '../../core/security/authorization/fastify-security'

export const openapiController = async (fastify: FastifyInstance) => {
    fastify.get('/', GetOpenApiParams, async () => {
        return fastify.swagger()
    })
}

const GetOpenApiParams = {
    config: {
        security: securityAccess.public(),
    },
}