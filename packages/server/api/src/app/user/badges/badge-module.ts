import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { userBadgeService } from './badge-service'

export const userBadgeModule: FastifyPluginAsyncZod = async (app) => {
    userBadgeService(app.log).setup()
}
