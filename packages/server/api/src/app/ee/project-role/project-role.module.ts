import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { projectRoleController } from './project-role.controller'

export const projectRoleModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(projectRoleController, { prefix: '/v1/project-roles' })
}
    