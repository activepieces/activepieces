import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { userBadgeService } from './badge-service'

export const userBadgeModule: FastifyPluginAsyncTypebox = async (app) => {
    userBadgeService(app.log).setup()
}
