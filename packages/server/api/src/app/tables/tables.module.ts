import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { fieldController } from './field/field.controller'
import { recordController } from './record/record.controller'
import { tablesController } from './table/table.controller'

export const tablesModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    await app.register(tablesController, { prefix: '/v1/tables' })
    await app.register(fieldController, { prefix: '/v1/fields' })
    await app.register(recordController, { prefix: '/v1/records' })
}
