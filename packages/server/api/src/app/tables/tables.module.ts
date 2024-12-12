import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { tablesController } from './table/table.controller'

export const tablesModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(tablesController, { prefix: '/v1/tables' })
}
