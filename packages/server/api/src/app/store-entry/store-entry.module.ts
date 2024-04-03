import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import {
    allowWorkersOnly,
    entitiesMustBeOwnedByCurrentProject,
} from '../authentication/authorization'
import { storeEntryController } from './store-entry.controller'

export const storeEntryModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.addHook('preHandler', allowWorkersOnly)
    await app.register(storeEntryController, { prefix: '/v1/store-entries' })
}
