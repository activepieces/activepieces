import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { i18nController } from './i18n-controller'
export const i18nModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(i18nController, { prefix: '/v1/' })
}