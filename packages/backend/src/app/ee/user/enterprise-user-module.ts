import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { enterpriseUserController } from './enterprise-user-controller'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'

export const enterpriseUserModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(enterpriseUserController, { prefix: '/v1/users' })
}
