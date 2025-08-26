import { FastifyPluginAsync } from 'fastify'
import fastifyXmlBodyParser from 'fastify-xml-body-parser'
import { webhookController } from './webhook-controller'

export const webhookModule: FastifyPluginAsync = async (app) => {
    await app.register(fastifyXmlBodyParser)
    await app.register(webhookController, { prefix: '/v1/webhooks' })

}
