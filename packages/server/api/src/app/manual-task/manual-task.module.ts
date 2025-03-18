import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { manualTaskController } from './manual-task.controller'

export const manualTaskModule: FastifyPluginAsyncTypebox = async (fastify) => {
    await fastify.register(manualTaskController, { prefix: '/v1/manual-tasks' })
}