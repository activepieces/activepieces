import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { projectRoleController } from './project-role.controller'

export const projectRoleModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(projectRoleController, { prefix: '/v1/project-roles' })
}
    