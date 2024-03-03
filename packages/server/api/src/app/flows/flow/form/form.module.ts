import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { formController } from './form.controller'

export const formModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(formController, { prefix: '/v1/forms' })
}
