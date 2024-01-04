import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { projectController } from './project-controller'

export const projectModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(projectController, { prefix: '/v1/users/projects' })
}


