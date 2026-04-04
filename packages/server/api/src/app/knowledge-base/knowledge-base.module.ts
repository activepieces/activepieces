import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { knowledgeBaseController } from './knowledge-base.controller'

export const knowledgeBaseModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(knowledgeBaseController, { prefix: '/v1/knowledge-base/files' })
}
