import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { oauthController } from './oauth-controller'
import { oauthMetadataController } from './oauth-metadata-controller'

export const oauthModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(oauthController, { prefix: '/v1/oauth' })
    await app.register(oauthMetadataController)
}
