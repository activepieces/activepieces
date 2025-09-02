import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { issuesController } from './issues-controller'

export const issuesModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(issuesController, { prefix: '/v1/issues' })
}
