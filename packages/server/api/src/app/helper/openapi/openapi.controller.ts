import { FastifyInstance } from 'fastify'

export const openapiController = async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
        return JSON.stringify(fastify.swagger(), null, 2)
    })
}
