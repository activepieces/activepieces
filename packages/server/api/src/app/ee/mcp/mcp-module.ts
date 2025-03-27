import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { mcpController } from './mcp-controller'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'

export const mcpModule: FastifyPluginAsyncTypebox = async (app) => {
    // app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(mcpController, { prefix: '/v1/mcp' })
}
