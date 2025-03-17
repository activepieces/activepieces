import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { manualTaskCommentController } from './comment/manual-task-comment.controller'
import { manualTaskController } from './manual-task.controller'

export const manualTaskModule: FastifyPluginAsyncTypebox = async (fastify) => {
    await fastify.register(manualTaskController, { prefix: '/v1/manual-tasks' })
    await fastify.register(manualTaskCommentController, { prefix: '/v1/manual-tasks/:taskId/comments' })
}