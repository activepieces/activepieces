import { FastifyInstance } from 'fastify'

import { storeEntryController } from './store-entry.controller'
import { allowWorkersOnly, entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'

export const storeEntryModule = async (app: FastifyInstance) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.addHook('onRequest', allowWorkersOnly)
    app.register(storeEntryController, { prefix: '/v1/store-entries' })
}
