import { FastifyInstance, FastifyPluginOptions } from "fastify"

export const userController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.get('/', async (_request, _reply) => {
        return { hello: 'world' }
    })
};
