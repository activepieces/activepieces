import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { agentRunsController } from './agent-runs-controller'

export const agentRunsModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(agentRunsController, { prefix: '/v1/agent-runs' })
}
