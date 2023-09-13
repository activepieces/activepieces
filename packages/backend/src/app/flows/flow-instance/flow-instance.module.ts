import { flowInstanceController } from './flow-instance.controller'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

export const flowInstanceModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(flowInstanceController, { prefix: '/v1/flow-instances' })
}
