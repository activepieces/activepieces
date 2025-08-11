import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { solutionsController } from './solutions.controller'

export const solutionsModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(solutionsController, { prefix: '/v1/solutions' })
}
