import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { issuesController } from './issues-controller'

export const issuesModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(issuesController, { prefix: '/v1/issues' })
}
