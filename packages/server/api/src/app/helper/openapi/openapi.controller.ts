import { securityAccess } from '@activepieces/server-shared'
import { FastifyInstance } from 'fastify'

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