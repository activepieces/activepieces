import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { userBadgeController } from './badge-controller'
import { userBadgeService } from './badge-service'

export const userBadgeModule: FastifyPluginAsyncTypebox = async (app) => {
    userBadgeService(app.log).setup()
    await app.register(userBadgeController, { prefix: '/v1/user-badges' })
}
