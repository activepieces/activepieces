import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformConfigurationController } from './platform-configuration.controller'

export const platformConfigurationModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformConfigurationController, { prefix: '/v1/platform-configurations' })
}
