import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { projectRoleController } from './project-role.controller'

export const projectRoleModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(projectRoleController, { prefix: '/v1/project-roles' })
}
    