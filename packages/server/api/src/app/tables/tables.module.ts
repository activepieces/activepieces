import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { fieldController } from './field/field.controller'
import { recordController } from './record/record.controller'
import { tablesController } from './table/table.controller'

export const tablesModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(tablesController, { prefix: '/v1/tables' })
    await app.register(fieldController, { prefix: '/v1/tables' })
    await app.register(recordController, { prefix: '/v1/tables' })
}
