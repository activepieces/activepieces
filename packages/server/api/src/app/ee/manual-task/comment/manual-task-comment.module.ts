import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { manualTaskCommentController } from './manual-task-comment.controller'

export const manualTaskCommentModule: FastifyPluginAsyncTypebox = async (fastify) => {
    await fastify.register(manualTaskCommentController, { prefix: '/v1/manual-tasks/:taskId/comments' })
}