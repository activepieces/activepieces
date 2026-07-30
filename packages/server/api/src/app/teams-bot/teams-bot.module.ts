import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { teamsBotController } from './teams-bot.controller'

export const teamsBotModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(teamsBotController, { prefix: '/v1/teams-bot' })
}
